import React from 'react';
import http from 'http';

export default class App extends React.Component {
  sendMail(){
    var api_key = 'key-1f632b8782f4a818f19c91a4cffa6dfd';
    var domain = 'sandboxc2ea7d6c06b340e7a5336b0576e55bed.mailgun.org';
    var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

    var data = {
      "from": "Mailgun Sandbox <postmaster@sandboxc2ea7d6c06b340e7a5336b0576e55bed.mailgun.org>",
      "to": "Alexander Theimer <aalex@dpsg-kaufering.de>",
      "subject": "Hello Alexander Theimer",
      "text": "Congratulations Alexander Theimer, you just sent an email with Mailgun!  You are truly awesome!"
    };

    mailgun.messages().send(data, function (error, body) {
      console.log(body);
    });
  }

  render() {
    return (<div>
      <h2>Welcome to React!</h2>
      <a href="#" onClick={this.sendMail}>Klick mich</a>
    </div>);
  }
}
