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
    userNickname: string,
    emailAddress: string,
    signupVerifyToken: string,
  ) {
    const BASE_URL = this.configService.get('BASE_URL');
    const url = `${BASE_URL}/users/${uid}/verify/${signupVerifyToken}`;

    const mailOptions = {
      to: emailAddress,
      subject: '[모도코] 이메일 인증을 완료해주세요.',
      html: this.getVerificationHTML(userNickname, url),
      text: `
      모도코(modocode.com)의 가입 인증을 위해 아래 링크로 접속해주세요.
      인증 주소: ${url}
      
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
  public async sendSignupSucceedMail(userNickname, emailAddress: string) {
    const MODOCO_URL = this.configService.get('FRONTEND_URL');
    const NOTION_URL = this.configService.get('NOTION_URL');

    const mailOptions = {
      to: emailAddress,
      subject: '[모도코] 회원가입이 완료되었습니다.',
      html: this.getSignupHTML(userNickname, MODOCO_URL, NOTION_URL),
      text: `
      모도코 회원가입을 축하드립니다.
      
      저희는 여러 개발자들과 모각코를 하기 위해 디스코드 커뮤니티를 운영하고 있습니다.
      이용에 참고해주시길 바랍니다.
      노션 안내 링크 : ${NOTION_URL}
      
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

  private getVerificationHTML(userNickname: string, url: string) {
    return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=
    =1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR&display=swap" rel="stylesheet">
      </head>
      <body>
        <div
          class="container"
          style="
            min-height: 100vh;
            background-color: #f3f4fa;
            font-family: 'IBM Plex Sans KR', sans-serif;
            padding: 20px;
          "
        >
          <div
            class="main-panel"
            style="max-width: 600px; background-color: #ffffff; margin: 0px auto"
          >
            <div class="main-header" style="padding: 32px">
              <img
                style="height: 40px; width: 150px;"
                src="https://user-images.githubusercontent.com/64428916/195529497-b629096b-2bce-48a1-aa3e-524984fe5ab9.png"
              />
            </div>
            <div class="main-divider" style="border-top: 1px solid #f3f4fa"></div>
            <div class="main-content" style="padding: 32px 32px 64px 32px">
                <h1
                    class="title"
                    style="
                        color: #1b1e2e;
                        font-size: 24px;
                        line-height: 36px;
                        margin: 0 0 40px 0;
                        font-family: 'IBM Plex Sans KR', sans-serif;
                    "
                    >
                  [모도코] 이메일 인증을 완료해주세요!
                </h1>
                <p
                    class="text-block"
                    style="
                        font-size: 16px;
                        color: #747994;
                        margin: 0 0 18px 0;
                        line-height: 24px;
                    "
                >
                  안녕하세요, ${userNickname} 님✨
                </p>
                <p
                    class="text-block"
                    style="
                        font-size: 16px;
                        color: #747994;
                        margin: 0 0 18px 0;
                        line-height: 24px;
                    "
                >
                <a href="https://modocode.com">모도코</a>의 가입 인증을 위해 가입 확인 버튼를 눌러주세요. <br />
                <form action="${url}" method="GET">
                  <button
                    class="link-button"
                    style="
                        display: inline-block;
                        border-radius: 4px;
                        font-size: 16px;
                        font-family: 'IBM Plex Sans KR', sans-serif;
                        color: #ffffff;
                        text-align: center;
                        background-color: #7049e3;
                        text-decoration: none;
                        cursor: pointer;
                        border: 1px solid #7049e3;
                        margin: 22px 0 40px 0;
                        padding: 12px 25px;
                    "
                >
                  가입 확인
                </button>
                </form>
                </p>
                <p
                    class="text-block"
                    style="
                        font-size: 16px;
                        color: #747994;
                        margin: 0 0 18px 0;
                        line-height: 24px;
                    "
                >
                만약 버튼이 작동하지 않는다면 아래 링크로 접속해주세요. <br />
                <a href="${url}">${url}</a>
                </p>
                <p
                    class="text-block"
                    style="
                        font-size: 16px;
                        color: #747994;
                        margin: 0 0 18px 0;
                        line-height: 24px;
                    "
                >
                    감사합니다😊<br/>modoco Team
                </p>
            </div>
          </div>
          <div
            style="
              margin: 0px auto;
              max-width: 600px;
              padding: 28px;
              text-align: center;
            "
          >
            <p
              class="address"
              style="
                font-size: 12px;
                text-align: center;
                color: #747994;
                margin: 24px 0 12px 0;
              "
            >
            (주)모도코 | Team : FIRE<br>
            서울특별시 강남구 테헤란로 311 59-12 아남타워 7층<br>
            Contact : 010-6449-3924 | yeonggi@kakao.com
            </p>
          </div>
        </div>
    </body>
    </html>
    
    `;
  }

  private getSignupHTML(
    userNickname: string,
    MODOCO_URL: string,
    NOTION_URL: string,
  ) {
    return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=
    =1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR&display=swap" rel="stylesheet">
      </head>
      <body>
        <div
          class="container"
          style="
            min-height: 100vh;
            background-color: #f3f4fa;
            font-family: 'IBM Plex Sans KR', sans-serif;
            padding: 20px;
          "
        >
          <div
            class="main-panel"
            style="max-width: 600px; background-color: #ffffff; margin: 0px auto"
          >
            <div class="main-header" style="padding: 32px">
              <img
                style="height: 40px; width: 150px;"
                src="https://user-images.githubusercontent.com/64428916/195529497-b629096b-2bce-48a1-aa3e-524984fe5ab9.png"
              />
            </div>
            <div class="main-divider" style="border-top: 1px solid #f3f4fa"></div>
            <div class="main-content" style="padding: 32px 32px 64px 32px">
                <h1
                    class="title"
                    style="
                        color: #1b1e2e;
                        font-size: 24px;
                        line-height: 36px;
                        margin: 0 0 40px 0;
                        font-family: 'IBM Plex Sans KR', sans-serif;
                    "
                    >
                    [모도코] 회원가입이 완료되었습니다.
                </h1>
                <p
                    class="text-block"
                    style="
                        font-size: 16px;
                        color: #747994;
                        margin: 0 0 18px 0;
                        line-height: 24px;
                    "
                >
                  안녕하세요, ${userNickname} 님✨
                </p>
                <p
                    class="text-block"
                    style="
                        font-size: 16px;
                        color: #747994;
                        margin: 0 0 18px 0;
                        line-height: 24px;
                    "
                >
                <a href="${MODOCO_URL}">모도코</a> 회원가입을 축하드립니다. <br />
                </p>
                <p
                    class="text-block"
                    style="
                        font-size: 16px;
                        color: #747994;
                        margin: 0 0 18px 0;
                        line-height: 24px;
                    "
                >
                  저희는 여러 개발자들과 모각코를 하기 위해 디스코드 커뮤니티를 운영하고 있습니다.<br />
                  이용에 참고해주시길 바랍니다.<br /><br />
                  안내 페이지: <a href="${NOTION_URL}">${NOTION_URL}</a>
                </p>
                <p
                    class="text-block"
                    style="
                        font-size: 16px;
                        color: #747994;
                        margin: 0 0 18px 0;
                        line-height: 24px;
                    "
                >
                    감사합니다😊<br/>modoco Team
                </p>
            </div>
          </div>
          <div
            style="
              margin: 0px auto;
              max-width: 600px;
              padding: 28px;
              text-align: center;
            "
          >
            <p
              class="address"
              style="
                font-size: 12px;
                text-align: center;
                color: #747994;
                margin: 24px 0 12px 0;
              "
            >
            (주)모도코 | Team : FIRE<br>
            서울특별시 강남구 테헤란로 311 59-12 아남타워 7층<br>
            Contact : 010-6449-3924 | yeonggi@kakao.com
            </p>
          </div>
        </div>
    </body>
    </html>
    `;
  }
}
