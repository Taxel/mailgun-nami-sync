import React from 'react';
import { Paper, TextField, RaisedButton,  Divider } from 'material-ui';
import fs from 'fs';
import path from 'path';
import NamiAPI from '../lib/nami.js'


export default class ConfigPage extends React.Component{
  constructor(){
    super();

    this.state = {
      loading: true,
      keys: null,
      keysUnlocked: false
    }

  }

  componentDidMount(){
    fs.readFile(path.join(__dirname, '../lib/keys.json'), 'utf8', (err, data)=> {
      if (err) throw err;
      let newState = {keys: JSON.parse(data), loading: false};
      this.setState(newState);
    });
  }



  render(){
    let {loading, keys, keysUnlocked} = this.state;
    if(loading){
      return (
        <Paper>
          Lese Config Dateien...
        </Paper>)
    }

    return (
      <div>
    <Paper className="scrollable">
      <h2>API und Nami Info</h2>
      <TextField
      className="textField"
      defaultValue={keys.key}
      floatingLabelText="Mailgun API Key"
      floatingLabelFixed={true}
      disabled={!keysUnlocked}
    /><TextField
    className="textField"
    defaultValue={keys.domain}
    floatingLabelText="Mailgun Domain"
    floatingLabelFixed={true}
    disabled={!keysUnlocked}
  /><br /><TextField
  className="textField"
  defaultValue={keys.nami_user}
  floatingLabelText="Nami Benutzername"
  floatingLabelFixed={true}
  disabled={!keysUnlocked}
/><TextField
      className="textField"
defaultValue={keys.nami_pw}
floatingLabelText="Nami Passwort"
floatingLabelFixed={true}
disabled={!keysUnlocked}
type={(keysUnlocked) ? "text" : "password"}
/><br />

<RaisedButton label={(keysUnlocked) ? "sperren" : "entsperren"} onClick={()=>this.setState({keysUnlocked: !keysUnlocked})}/>
    </Paper>
    <Divider />

    </div>)
  }
}
