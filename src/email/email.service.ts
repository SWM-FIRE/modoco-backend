import { Injectable } from '@nestjs/common';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: 'ap-northeast-2',
    });
  }

  /**
   * @description send verification email
   * @param {string} emailAddress email address
   * @param {string} signupVerifyToken signup verify token
   * @param {number} uid user id
   */
  public async sendVerificationMail(
    uid: number,
    emailAddress: string,
    signupVerifyToken: string,
  ) {
    const BASE_URL = 'http://localhost:3333/api/v1'; // TODO: config
    //const BASE_URL = this.configService.get('BASE_URL');
    const url = `${BASE_URL}/users/${uid}?token=${signupVerifyToken}`;

    const mailOptions = {
      to: emailAddress,
      subject: '모도코 가입 인증 메일입니다.',
      html: `
        <h2>가입 인증을 위해 가입 확인 버튼를 눌러주세요.</h2>
        <form action="${url}" method="POST">
          <button>가입 확인</button>
        </form>
        <p>
          만약 버튼이 작동하지 않는다면 아래 링크로 접속해주세요. <br />
          <a href="${url}">${url}</a>
        </p>
        <p>감사합니다.</p>
        <p>모도코 팀 드림</p>
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

// public async sendVerificationMail(
//   emailAddress: string,
//   signupVerifyToken: string,
//   uid: number,
// ) {
//   const BASE_URL = 'http://localhost:3333/api/v1'; // TODO: config
//   //const BASE_URL = this.configService.get('BASE_URL');
//   const url = `${BASE_URL}/users/${uid}?token=${signupVerifyToken}`;
//   const from = ''; // TODO: config
//
//   const mailOptions: EmailOptions = {
//     from,
//     to: emailAddress,
//     subject: '모도코 가입 인증 메일입니다.',
//     html: `
//       <h2>가입 인증을 위해 가입 확인 버튼를 눌러주세요.</h2>
//       <form action="${url}" method="POST">
//         <button>가입 확인</button>
//       </form>
//       <p>
//         만약 버튼이 작동하지 않는다면 아래 링크를 클릭해주세요. <br />
//         <a href="${url}">${url}</a>
//       </p>
//       <p>감사합니다.</p>
//       <p>모도코 팀 드림</p>
//     `,
//   };
//
//   return await this.sendEmail(mailOptions);
// }
//
// private sendEmail(mailOptions: EmailOptions) {
//   return this.transporter.sendMail(mailOptions);
// }
