import {
  AutoScalingClient,
  CompleteLifecycleActionCommand,
  DescribeAutoScalingInstancesCommand,
} from '@aws-sdk/client-auto-scaling';
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { lastValueFrom, map, Subject } from 'rxjs';
import { AppService } from '../app.service';

@Injectable()
export class ShutdownService implements OnModuleInit, OnModuleDestroy {
  private readonly HEALTH_CHECK_INTERVAL: number = this.configService.get(
    'HEALTH_CHECK_INTERVAL',
  );
  private readonly AWS_METADATA_TOKEN_URL: string = this.configService.get(
    'AWS_METADATA_TOKEN_URL',
  );
  private readonly AWS_INSTANCE_ID_URL: string = this.configService.get(
    'AWS_INSTANCE_ID_URL',
  );
  private readonly AWS_REGION: string = this.configService.get('AWS_REGION');
  private readonly ENV: string = this.configService.get('ENV');
  private shutdownAppListener$: Subject<void> = new Subject();
  private shutdownWebsocketListener$: Subject<void> = new Subject();
  private logger = new Logger('ShutdownService');
  private instanceId: string;
  private autoScalingGroupName: string;
  private client: AutoScalingClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
  ) {
    this.client = new AutoScalingClient({ region: this.AWS_REGION });
  }

  async onModuleInit() {
    if (this.ENV === ENV.PROD) {
      const token = await this.getMetadataToken();
      this.instanceId = await this.getInstanceId(token);
      this.autoScalingGroupName = await this.getInstanceAutoScalingGroupName();
      this.logger.warn(
        `Instance ID :: ${this.instanceId} Started, AutoSacaleGroup :: ${this.autoScalingGroupName}`,
      );
    } else {
      // this.logger.debug('Local Environment');
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkLifecycleState() {
    if (!AppService.active) return;

    if (this.ENV === ENV.PROD) {
      const state = await this.getInstanceLifecycleState();
      if (state === LIFECYCLE_STATE.TERMINATING_WAIT) {
        this.shutdown();
      }
    } else {
      // ENV.DEV, ENV.TEST
      //this.logger.debug('Called every 10 seconds');
    }
  }

  onModuleDestroy() {
    this.logger.log(`Instance ID :: ${this.instanceId} Shutdown`);
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

    // 4. send continue event to AWS Auto Scaling Lifecycle Hook
    await this.continueInstanceTerminatingState();

    // 4. shutdown nestjs app
    this.logger.warn('Terminating hook job all done. Bye Bye~');
    this.shutdownAppListener$.next();
    process.exit(0);
  }

  private getMetadataToken(): Promise<string> {
    const request = this.http
      .put(this.AWS_METADATA_TOKEN_URL, null, {
        headers: {
          'X-aws-ec2-metadata-token-ttl-seconds': 10,
        },
      })
      .pipe(map((res) => res.data));

    return lastValueFrom(request);
  }

  private getInstanceId(token: string): Promise<string> {
    const request = this.http
      .get(this.AWS_INSTANCE_ID_URL, {
        headers: {
          'X-aws-ec2-metadata-token': token,
        },
      })
      .pipe(map((res) => res.data));

    return lastValueFrom(request);
  }

  private async getInstanceLifecycleState() {
    const response = await this.getInstanceDescription();

    return response.AutoScalingInstances[0]?.LifecycleState;
  }

  private async getInstanceAutoScalingGroupName() {
    const response = await this.getInstanceDescription();

    return response.AutoScalingInstances[0]?.AutoScalingGroupName;
  }

  private getInstanceDescription() {
    return this.client.send(
      new DescribeAutoScalingInstancesCommand({
        InstanceIds: [this.instanceId],
        MaxRecords: 1,
      }),
    );
  }

  private async continueInstanceTerminatingState() {
    this.autoScalingGroupName = await this.getInstanceAutoScalingGroupName();
    this.logger.warn(
      `Continue instance terminating state on ${this.instanceId} :: ${this.autoScalingGroupName}`,
    );

    return this.client.send(
      new CompleteLifecycleActionCommand({
        AutoScalingGroupName: this.autoScalingGroupName,
        InstanceId: this.instanceId,
        LifecycleActionResult: LIFECYCLE_ACTION_RESULT.CONTINUE,
        LifecycleHookName: this.autoScalingGroupName,
      }),
    );
  }

  private async waitUntilHealthCheckFail(seconds: number) {
    this.logger.log(`Wait health check to fail :: ${seconds} ms`);
    await this.sleep(seconds);
  }

  private async waitUntilClientDisconnection(seconds: number) {
    this.logger.log(`Wait client disconnection :: ${seconds} ms`);
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

const enum LIFECYCLE_ACTION_RESULT {
  CONTINUE = 'CONTINUE',
  ABANDON = 'ABANDON',
}
