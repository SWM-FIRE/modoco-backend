import { Injectable } from '@nestjs/common';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private sesClient: SESClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get('AWS_REGION');
    this.sesClient = new SESClient({
      region,
    });
  }

  /**
   * @description send verification email
   * @param {number} uid user id
   * @param {string} emailAddress email address
   * @param {string} signupVerifyToken signup verify token
   */
  public async sendVerificationMail(
    uid: number,
    emailAddress: string,
    signupVerifyToken: string,
  ) {
    const BASE_URL = this.configService.get('BASE_URL');
    const url = `${BASE_URL}/users/${uid}/verify/${signupVerifyToken}`;

    const mailOptions = {
      to: emailAddress,
      subject: '모도코 가입 인증 메일입니다.',
      html: `
        <h2>가입 인증을 위해 가입 확인 버튼를 눌러주세요.</h2>
        <form action="${url}" method="GET">
          <button>가입 확인</button>
        </form>
        <p>
          만약 버튼이 작동하지 않는다면 아래 링크로 접속해주세요. <br />
          <a href="${url}">${url}</a>
        </p>
        <p>감사합니다.</p>
        <p> - 모도코 팀 드림 - </p>
      `,
    };

    const command = this.createSendEmailCommand(mailOptions);
    return await this.sendEmail(command);
  }

  /**
   * @description send signup congratulation email
   * @param {number} uid user id
   * @param {string} emailAddress email address
   * @param {string} signupVerifyToken signup verify token
   */
  public async sendSignupSucceedMail(emailAddress: string) {
    const MODOCO_URL = this.configService.get('FRONTEND_URL');
    const NOTION_URL = this.configService.get('NOTION_URL');

    const mailOptions = {
      to: emailAddress,
      subject: '모도코 회원가입이 완료되었습니다.',
      html: `
        <h2><a href="${MODOCO_URL}">모도코</a> 회원가입을 축하드립니다.</h2>
        <p>
          저희는 여러 개발자들과 모각코를 하기 위해 디스코드 커뮤니티를 운영하고 있습니다.<br />
          이용에 참고해주시길 바랍니다.<br />
          <a href="${NOTION_URL}">[노션 안내 링크]</a>
        </p>
        <p>감사합니다.</p>
        <p> - 모도코 팀 드림 - </p>
      `,
    };

    const command = this.createSendEmailCommand(mailOptions);
    return await this.sendEmail(command);
  }

  /**
   * @description create SendEmailCommand
   * @param {string} to email address
   * @param {string} subject email subject
   * @param {string} html html email body
   * @private
   */
  private createSendEmailCommand({ to, subject, html }) {
    return new SendEmailCommand({
      Destination: {
        CcAddresses: [],
        ToAddresses: [to], // 받을 사람의 이메일
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: 'no-reply@mail.modoing.net', // 보내는 사람의 이메일
      ReplyToAddresses: [],
    });
  }

  /**
   * @description used for testing email
   * @private
   */
  private async sendSimpleMail() {
    const command = this.createSendEmailCommand({
      to: 'dury.ko@gmail.com',
      subject: 'email test',
      html:
        '<h3>email test h3</h3>' +
        '<p>email test p tag</p> + <a href="modocode.com">modoco로 이동</a>',
    });

    await this.sendEmail(command);
  }

  /**
   * @description send email using ses api
   * @param {SendEmailCommand} command SendEmailCommand
   * @private
   */
  private async sendEmail(command: SendEmailCommand) {
    try {
      await this.sesClient.send(command);
    } catch (error) {
      console.error(error);
    }
  }
}
