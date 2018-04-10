import React from 'react';
import { Paper, TextField, RaisedButton,  Divider } from 'material-ui';
import fs from 'fs';
import path from 'path';
import NamiAPI from '../lib/nami.js';
import {loadEncrypted, saveEncrypted} from '../lib/keysEncryptor.js';


export default class ConfigPage extends React.Component{
  constructor(){
    super();

    this.save = this.save.bind(this);
    this.reset = this.reset.bind(this);

    this.refMailgunKey = null;
    this.refMailgunDomain = null;
    this.refNamiUser = null;
    this.refNamiPass = null;

    this.state = {
      loading: true,
      keys: null,
      keysUnlocked: false,
      password: "test"
    }

  }

  componentDidMount(){
    this.reset();
  }

  save(){
    let keys = this.state.keys;
    if(this.refMailgunKey)
      keys.key = this.refMailgunKey.input.value || null;

    if(this.refMailgunDomain)
      keys.domain = this.refMailgunDomain.input.value || null;

    if(this.refNamiUser)
      keys.nami_user = this.refNamiUser.input.value || null;

    if(this.refNamiPass)
      keys.nami_pw = this.refNamiPass.input.value || null;

    saveEncrypted(this.state.password, keys);
    this.setState({keys: keys, keysUnlocked: false});

  }

  reset(){
    this.setState({keys: loadEncrypted(this.state.password), loading: false}, ()=>{
      let {key, domain, nami_user, nami_pw} = this.state.keys;
      if(this.refMailgunKey)
        this.refMailgunKey.input.value = key;

      if(this.refMailgunDomain)
        this.refMailgunDomain.input.value = domain;

      if(this.refNamiUser)
        this.refNamiUser.input.value = nami_user;

      if(this.refNamiPass)
        this.refNamiPass.input.value = nami_pw;
    })
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
      ref={element => {this.refMailgunKey = element}}
      className="textField"
      defaultValue={keys.key}
      floatingLabelText="Mailgun API Key"
      floatingLabelFixed={true}
      disabled={!keysUnlocked}
    /><TextField
    ref={element => {this.refMailgunDomain = element}}
    className="textField"
    defaultValue={keys.domain}
    floatingLabelText="Mailgun Domain"
    floatingLabelFixed={true}
    disabled={!keysUnlocked}
  /><br /><TextField
  ref={element => {this.refNamiUser = element}}
  className="textField"
  defaultValue={keys.nami_user}
  floatingLabelText="Nami Benutzername"
  floatingLabelFixed={true}
  disabled={!keysUnlocked}
/><TextField
ref={element => {this.refNamiPass = element}}
      className="textField"
defaultValue={keys.nami_pw}
floatingLabelText="Nami Passwort"
floatingLabelFixed={true}
disabled={!keysUnlocked}
type={(keysUnlocked) ? "text" : "password"}
/><br />

<RaisedButton label={(keysUnlocked) ? "sperren" : "entsperren"} onClick={()=>this.setState({keysUnlocked: !keysUnlocked})}/>
<RaisedButton label="Speichern" onClick={this.save} />
<RaisedButton label="Zurücksetzen" onClick={this.reset} />
    </Paper>
    <Divider />

    </div>)
  }
}
