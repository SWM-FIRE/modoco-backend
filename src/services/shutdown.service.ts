import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lastValueFrom, Subject } from 'rxjs';
import { AppService } from '../app.service';

@Injectable()
export class ShutdownService implements OnModuleDestroy {
  private readonly HEALTH_CHECK_INTERVAL: number = this.configService.get(
    'HEALTH_CHECK_INTERVAL',
  );
  private readonly AWS_METADATA_TOKEN_URL: string = this.configService.get(
    'AWS_METADATA_TOKEN_URL',
  );
  private readonly AWS_AUTOSCALING_STATE_URL: string = this.configService.get(
    'AWS_AUTOSCALING_STATE_URL',
  );
  private readonly ENV: string = this.configService.get('ENV');
  private shutdownAppListener$: Subject<void> = new Subject();
  private shutdownWebsocketListener$: Subject<void> = new Subject();
  private logger = new Logger('ShutdownService');

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    if (!AppService.active) return;

    if (this.ENV === ENV.PROD) {
      const token = await this.getMetadataToken();
      const state = await this.getAutoScalingLifeCycleState(token.data);
      //this.logger.log(`Auto Scaling State :: ${state.data}`);
      if (state.data === LIFECYCLE_STATE.TERMINATING_WAIT) {
        this.shutdown();
      }
    } else {
      // ENV.DEV, ENV.TEST
      this.logger.debug('Called every 10 seconds');
    }
  }

  onModuleDestroy() {
    this.logger.log('Executing On Destroy Hook');
  }

  subscribeToShutdownApp(shutdownFn: () => void): void {
    this.shutdownAppListener$.subscribe(() => shutdownFn());
  }

  subscribeToShutdownWebsocket(shutdownFn: () => void): void {
    this.shutdownWebsocketListener$.subscribe(() => shutdownFn());
  }

  async shutdown() {
    // 1. wait until health check fail
    AppService.active = false;
    await this.waitUntilHealthCheckFail(this.HEALTH_CHECK_INTERVAL * 2 + 2000);

    // 2. send shutdown event to client
    this.shutdownWebsocketListener$.next();

    // 3. wait until all clients to disconnect
    await this.waitUntilClientDisconnection(5000);

    // 4. shutdown nestjs app
    this.logger.warn('Shutdown app');
    this.shutdownAppListener$.next();
    process.exit(0);
  }

  private getMetadataToken() {
    const request = this.http.put(this.AWS_METADATA_TOKEN_URL, null, {
      headers: {
        'X-aws-ec2-metadata-token-ttl-seconds': 10,
      },
    });

    return lastValueFrom(request);
  }

  private getAutoScalingLifeCycleState(token: string) {
    const request = this.http.get(this.AWS_AUTOSCALING_STATE_URL, {
      headers: {
        'X-aws-ec2-metadata-token': token,
      },
    });

    return lastValueFrom(request);
  }

  private async waitUntilHealthCheckFail(seconds: number) {
    this.logger.warn(`Wait health check to fail :: ${seconds} ms`);
    await this.sleep(seconds);
  }

  private async waitUntilClientDisconnection(seconds: number) {
    this.logger.warn(`Wait client disconnection :: ${seconds} ms`);
    return this.sleep(seconds);
  }

  private sleep(ms: number) {
    new Promise((r) => setTimeout(r, ms));
  }
}

const enum ENV {
  PROD = 'production',
  DEV = 'development',
  TEST = 'test',
}

const enum LIFECYCLE_STATE {
  IN_SERVICE = 'InService',
  TERMINATING_WAIT = 'Terminating:Wait',
  TERMINATUNG_PROCEED = 'Terminating:Proceed',
}
