import React from 'react';
import {loadEncrypted, doesEncryptedFileExist, isPasswordCorrect, deleteEncryptedFile} from '../lib/keysEncryptor.js';
import { Paper, TextField, MuiThemeProvider, RaisedButton, Stepper, StepLabel, Dialog, AppBar } from 'material-ui';
import Step from 'material-ui/Stepper/Step';

export default class LoginPage extends React.Component {
  constructor(){
    super();
    this.state = {
      passwordWrong: false,
      showConfirmPasswordDelete: false
    }
    this.passwordField = null;

    this.validatePassword = this.validatePassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  /**
   * deletes the encrypted file and starts the setup
   */
  resetPassword(){
    deleteEncryptedFile();
    //TODO: show setup!
    this.props.gotoSetup();

  }

  validatePassword(){
    let correct = false, pass = "";
    if(this.passwordField){
      pass = this.passwordField.input.value;
    }
    correct = isPasswordCorrect(pass);
    if(correct){
      //set master password in global object of main process
      require("electron").remote.getGlobal("sharedObj").masterPassword = pass;
        //tell app.jsx that the user is logged in
        this.props.loginComplete();

    }
    else {
      this.setState({passwordWrong: true});
    }
  }

  render(){
    let body = null;
    let {passwordWrong, showConfirmPasswordDelete} = this.state;

    return(
      <MuiThemeProvider>
        <div>
        <AppBar
    title="Nami Mailgun Synch"
    zDepth={3}
    style={{zIndex:1700}}
    showMenuIconButton={false}
  />
    <Paper className="bodyContainer setupGrid">


    <div className="setupBody">
    Bitte gib dein Masterpasswort ein.
    <br/>
    <TextField type="password" hintText="Masterpasswort" onKeyPress={(ev) => {
      //catch enter being pressed
    if (ev.key === 'Enter') {
      // Do code here
      ev.preventDefault();
      this.validatePassword();

    }
  }} ref={component => {this.passwordField = component}} errorText={(passwordWrong) ? "Das eingegebene Passwort is falsch" : ""}/>
    <br />
    <RaisedButton label="OK" primary={true} onClick={this.validatePassword}/> <RaisedButton label="Passwort vergessen" secondary={true} onClick={()=>this.setState({showConfirmPasswordDelete: true})}/>
    <br/>


    <Dialog title="Bitte bestätigen"
    modal={true}
    open={showConfirmPasswordDelete}
    actions={[
      (<RaisedButton label="Verstanden" secondary={true} onClick={this.resetPassword}/>),
      (<RaisedButton label="Abbrechen" primary={true} onClick={()=>this.setState({showConfirmPasswordDelete: false})}/>)
    ]}>
    Du bist im Begriff, die bestehenden Nami und Mailgun Anmeldedaten unwiderruflich zu löschen!
    </Dialog>
  </div>

    </Paper>
    </div>
    </MuiThemeProvider>
    )
  }
}
