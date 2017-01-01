import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as request from 'request';

const MediumEditor = require('medium-editor');

require('./App.css');
require('./medium-editor.css');
require('./medium-beagle.css');

interface Props {}

interface State {
  subject?: string;
  css?: string;
  key?: string;
  html?: string;
  status?: JSX.Element;
  requestPending?: boolean;
  [name: string]: any;
}

export class App extends React.Component<Props, State> {
  link: HTMLLinkElement;
  editor: any;
  saveTimer: number;
  refs: {
    subject: HTMLInputElement;
    css: HTMLInputElement;
    key: HTMLInputElement;
    [key: string]: any;
  }

  constructor() {
    super();
    this.onSubmit = this.onSubmit.bind(this);
    this.syncState = this.syncState.bind(this);
    this.saveState = this.saveState.bind(this);
    this.refreshCSS = this.refreshCSS.bind(this);
    this.onRequestResponse = this.onRequestResponse.bind(this);
    this.state = {
      subject: '',
      css: '',
      key: '',
      html: '',
      status: undefined,
      requestPending: false
    };
    // Restore state from localStorage
    const settings = window.localStorage.getItem('settings');
    if (settings) {
      const settingsDecoded = JSON.parse(window.localStorage['settings'] );
      for (let key in settingsDecoded) {
        this.state[key] = settingsDecoded[key];
      }
    }
    // Add link
    this.link = document.createElement('link');
    this.link.type = 'text/css';
    this.link.rel = 'stylesheet';
    document.head.appendChild(this.link);
  }

  componentDidMount() {
    this.editor = new MediumEditor('.App-editor-content', {
      buttonLabels: 'fontawesome'
    });
    // Restore state
    this.editor.setContent(this.state.html);
    // Subscribe to changes
    this.editor.subscribe('editableInput', (event: any, editable: any) => {
      this.setState({
        html: editable.innerHTML
      });
      this.queueSave();
    });
    // Apply styles
    this.refreshCSS();
    this.setState({
      status: (
        <div className='text-info'>
          <i className='fa fa-smile-o'></i> Ready!
        </div>
      )
    });
  }

  render() {
    return (
      <div>
        <form>
          {/* Subject */}
          <div className='form-group'>
            <input
              ref='subject'
              type='subject'
              className='form-control'
              placeholder='Subject'
              value={this.state.subject}
              onChange={this.syncState} />
          </div>
          {/* CSS source */}
          <div className='form-group'>
            <div className='input-group'>
              <input
                ref='css'
                type='css'
                className='form-control'
                placeholder='CSS Source'
                value={this.state.css}
                onChange={this.syncState} />
              <div
                className='input-group-addon btn btn-primary'
                onClick={this.refreshCSS}>Reload</div>
            </div>
          </div>
          {/* API key */}
          <div className='form-group'>
            <input
              ref='key'
              type='key'
              className='form-control'
              placeholder='API key'
              value={this.state.key}
              onChange={this.syncState} />
          </div>
          {/* HTML editor */}
          <div className='form-group'>
            <div className='form-control App-editor'>
              <div id='body' className='App-editor-content' />
            </div>
          </div>
          {/* Submit */}
          <button
            type='submit'
            className='btn btn-primary float-xs-right'
            onClick={this.onSubmit}>Submit</button>
        </form>
        {/* Status bar */}
        <nav className='navbar navbar-light navbar-fixed-bottom bg-faded'>
          {this.state.status}
        </nav>
      </div>
    );
  }

  getMailBody() {
    return ReactDOMServer.renderToString(
      <html>
        <body id='body'>${this.state.html}</body>
      </html>
    );
  }

  queueSave() {
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
    }
    this.saveTimer = window.setTimeout(this.saveState, 1000);
  }

  private syncState() {
    this.setState({
      subject: this.refs.subject.value,
      css: this.refs.css.value,
      key: this.refs.key.value
    });
    this.queueSave();
  }

  private saveState() {
    window.localStorage['settings'] = JSON.stringify({
      subject: this.state.subject,
      css: this.state.css,
      key: this.state.key,
      html: this.state.html
    });
    console.log('Saved settings', window.localStorage);
  }

  private refreshCSS() {
    const href = this.refs.css.value;
    if (href) {
      this.link.href = this.refs.css.value;
    }
  }

  private onSubmit(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.state.requestPending) {
      request.post({
        url: 'https://api.mailgun.net/v3/sector4.life/messages',
        auth: {
          user: 'api',
          pass: this.state.key
        },
        form: {
          from: 'no-reply@sector4.life',
          to: 'launch@sector4.life',
          subject: this.state.subject,
          html: this.getMailBody()
        }
      }, this.onRequestResponse);
      this.setState({
        status: (
          <div className='text-info'>
            <i className='fa fa-refresh fa-spin fa-fw'></i> Sending newsletter..
          </div>
        ),
        requestPending: true
      });
    }
  }

  private onRequestResponse(error: any, response: request.RequestResponse, body: any): void {
    if (error || response.statusCode !== 200) {
      if (response && response.statusCode === 401) {
        error = 'Invalid API key';
      }
      this.setState({
        status: (
          <div className='text-danger'>
            <i className='fa fa-exclamation-triangle'></i> {error || body}
          </div>
        ),
        requestPending: false
      });
    } else {
      this.setState({
        status: (
          <div className='text-info'>
            <i className='fa fa-envelope'></i> Mail was sent successfully!
          </div>
        ),
        requestPending: false
      });
    }
    console.log(response, body);
  }
}
