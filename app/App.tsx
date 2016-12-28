import * as React from 'react';

const MediumEditor = require('medium-editor');

require('./App.css');
require('./medium-editor.css');
require('./medium-beagle.css');

export class App extends React.Component<{}, {}> {
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
        <div className='App-editor' />
      </form>
    );
  }
}
