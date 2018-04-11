import React from 'react';
import { Paper, TextField, RaisedButton,  Divider, Snackbar } from 'material-ui';
import fs from 'fs';
import path from 'path';
import NamiAPI from '../lib/nami.js';
import {loadEncrypted, saveEncrypted} from '../lib/keysEncryptor.js';


export default class ConfigPage extends React.Component{
  constructor(){
    super();

    this.save = this.save.bind(this);
    this.reset = this.reset.bind(this);
    this.changeMasterPassword = this.changeMasterPassword.bind(this);

    this.refMailgunKey = null;
    this.refMailgunDomain = null;
    this.refNamiUser = null;
    this.refNamiPass = null;

    this.state = {
      loading: true,
      keys: null,
      keysUnlocked: false,
      password: require("electron").remote.getGlobal("sharedObj").masterPassword,
      passwordError: null,
      passwordChanged: false
    }

  }

  componentDidMount(){
    this.reset();
  }

  changeMasterPassword(){
    let oldPw = require("electron").remote.getGlobal("sharedObj").masterPassword;
    //check if old master password was entered correctly
    if(this.passwordOldField.input.value == oldPw){
      //check if both new fields are matching
      let pass = this.passwordField.input.value;
      if(pass == this.passwordField2.input.value){
        //decrypt with old pw
        let keyData = loadEncrypted(oldPw);
        //change pw
        require("electron").remote.getGlobal("sharedObj").masterPassword = pass;
        //encrypt with new pw
        saveEncrypted(pass, keyData);
        //clear inputs
        this.passwordField.input.value = "";
        this.passwordField2.input.value = "";
        this.passwordOldField.input.value = "";
        this.setState({passwordChanged: true});
      }else{
        this.setState({passwordError: "pws_dont_match"})
      }
    }else{
      this.setState({passwordError: "old_pw_wrong"})
    }
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
    <Paper className="scrollable setupGrid">
    <div className="contentLeft">
      <h2>API und Nami Info</h2>
      <RaisedButton label={(keysUnlocked) ? "sperren" : "entsperren"} onClick={()=>this.setState({keysUnlocked: !keysUnlocked})}/>

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

<RaisedButton label="Speichern" onClick={this.save} />
<RaisedButton label="Zurücksetzen" onClick={this.reset} />
</div>
    <Divider />
<div className="contentRight borderleft">
    <h2>Masterpasswort ändern:</h2>
    <TextField type="password" hintText="Altes Masterpasswort" ref={component => {this.passwordOldField = component}} errorText={(this.state.passwordError == "old_pw_wrong") ? "Falsches Masterpasswort" : ""}/>
    <br />
    <TextField type="password" hintText="Masterpasswort" ref={component => {this.passwordField = component}} />
    <br />
    <TextField type="password" hintText="Passwort wiederholen" ref={component => {this.passwordField2 = component}} errorText={(this.state.passwordError == "pws_dont_match") ? "Die Passwörter stimmen nicht überein" : ""}/>
   <br />
    <RaisedButton label="Masterpasswort ändern" onClick={this.changeMasterPassword}/>
    </div>
    </Paper>
    <Snackbar
          open={this.state.passwordChanged}
          message="Master Password Changed"
          autoHideDuration={2500}
          onRequestClose={()=>{this.setState({passwordChanged: false})}}
        />
    </div>)
  }
}
