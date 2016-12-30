import * as React from 'react';
import * as request from 'request';

const MediumEditor = require('medium-editor');

require('./App.css');
require('./medium-editor.css');
require('./medium-beagle.css');

export class App extends React.Component<{}, {}> {
  constructor() {
    super();
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    new MediumEditor('.App-editor');
  }

  render() {
    return (
      <form>
        <div className='form-group'>
          <input
            type='subject'
            className='form-control'
            placeholder='Subject' />
        </div>
        <div className='form-group'>
          <input
            type='css'
            className='form-control'
            placeholder='CSS Source' />
        </div>
        <div className='form-group'>
          <input
            type='key'
            className='form-control'
            placeholder='API key' />
        </div>
        <div className='form-group'>
          <div className='App-editor form-control' />
        </div>
        <button
          type='submit'
          className='btn btn-primary float-xs-right'
          onClick={this.onSubmit}>Submit</button>
      </form>
    );
  }

  onSubmit(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    request({
      method: 'POST',
      url: 'https://api.mailgun.net/v3/sector4.life/messages',
      auth: {
        user: 'api',
        pass: 'key-foo'
      }
    }, this.onRequestResponse);
  }

  onRequestResponse(error: any, response: request.RequestResponse, body: any): void {
    if (error) {
      console.error(error);
    }
    console.log(body);
  }
}
