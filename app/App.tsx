import * as React from 'react';
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
    this.state = {
      subject: '',
      css: '',
      key: '',
      html: ''
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
    this.editor = new MediumEditor('.App-editor', {
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
  }

  render() {
    return (
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
          <div className='App-editor form-control' />
        </div>
        {/* Submit */}
        <button
          type='submit'
          className='btn btn-primary float-xs-right'
          onClick={this.onSubmit}>Submit</button>
      </form>
    );
  }

  getFormattedText() {
    return `<html>${this.state.html}</html>`;
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
    window.localStorage['settings'] = JSON.stringify(this.state);
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
    request.post({
      url: 'https://api.mailgun.net/v3/sector4.life/messages',
      auth: {
        user: 'api',
        pass: this.state.key
      },
      form: {
        from: 'no-reply@sector4.life',
        to: 'launch@sector4.life',
        subject: 'Newsletter',
        html: this.getFormattedText()
      }
    }, this.onRequestResponse);
  }

  private onRequestResponse(error: any, response: request.RequestResponse, body: any): void {
    if (error) {
      console.error(error);
    }
    console.log(body);
  }
}
