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
      subject: '[모도코] 이메일 인증을 완료해주세요.',
      html: this.getVerificationHTML(url),
      text: `
      모도코(modocode.com)의 가입 인증을 위해 아래 링크로 접속해주세요.
      http://localhost:3333/api/v1/users/25/verify/50063bf0-489b-11ed-863b-11410ff17d4e
      
      감사합니다.
      
      - 모도코 팀 드림 -`,
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
      subject: '[모도코] 회원가입이 완료되었습니다.',
      html: this.getSignupHTML(MODOCO_URL, NOTION_URL),
      text: `
      모도코 회원가입을 축하드립니다.
      
      저희는 여러 개발자들과 모각코를 하기 위해 디스코드 커뮤니티를 운영하고 있습니다.
      이용에 참고해주시길 바랍니다.
      노션 안내 링크 : https://fortune-innocent-45c.notion.site/1-e022efdd1581461b994469a56af037f8
      
      감사합니다.
      
      - 모도코 팀 드림 -`,
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
  private createSendEmailCommand({ to, subject, html, text }) {
    const EMAIL_SOURCE = this.configService.get('EMAIL_SOURCE');

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
          Text: {
            Charset: 'UTF-8',
            Data: text,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: `no-reply@${EMAIL_SOURCE}`, // 보내는 사람의 이메일
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
      text: 'email test text',
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

  private getVerificationHTML(url: string) {
    return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>[모도코] 이메일 인증을 완료해주세요.</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body>
    <!-- OUTERMOST CONTAINER TABLE -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
      <tr>
        <td>
          <!-- 600px - 800px CONTENTS CONTAINER TABLE -->
          <table border="0" cellpadding="0" cellspacing="0" width="600">
            <tr>
              <td>
                <p>
                모도코(<a href="https://modocode.com">modocode.com</a>)의 가입 인증을 위해 가입 확인 버튼를 눌러주세요. <br />
                <form action="${url}" method="GET">
                  <button>가입 확인</button>
                </form>
                </p>
                <p>
                  만약 버튼이 작동하지 않는다면 아래 링크로 접속해주세요. <br />
                  <a href="${url}">${url}</a>
                </p>
                <p>감사합니다.</p>
                <p> - 모도코 팀 드림 - </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      </table>
    </body>
    </html>`;
  }

  private getSignupHTML(MODOCO_URL, NOTION_URL) {
    return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>[모도코] 회원 가입이 완료되었습니다.</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body>
    <!-- OUTERMOST CONTAINER TABLE -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable">
      <tr>
        <td>
          <!-- 600px - 800px CONTENTS CONTAINER TABLE -->
          <table border="0" cellpadding="0" cellspacing="0" width="600">
            <tr>
              <td>
                <p>
                  <a href="${MODOCO_URL}">모도코</a> 회원가입을 축하드립니다.
                </p>
                <p>
                  저희는 여러 개발자들과 모각코를 하기 위해 디스코드 커뮤니티를 운영하고 있습니다.<br />
                  이용에 참고해주시길 바랍니다.<br />
                  <a href="${NOTION_URL}">[노션 안내 링크]</a>
                </p>
                <p>감사합니다.</p>
                <p> - 모도코 팀 드림 - </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      </table>
    </body>
    </html>`;
  }
}
