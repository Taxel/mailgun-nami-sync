import React from 'react';
import {saveEncrypted} from '../lib/keysEncryptor.js';
import { Paper, TextField, MuiThemeProvider, RaisedButton, Stepper, StepLabel, Dialog, Snackbar } from 'material-ui';
import Step from 'material-ui/Stepper/Step';
import NamiAPI from '../lib/nami.js'

export default class SetupPage extends React.Component {
  constructor(){
    super();
    this.state = {
      //0 = welcome, 1 = set master password, 2 = set mg/nami keys
      stepIndex: 0,
      passwordsEqual: true,
      showConfirmPasswordDelete: false,
      password: null,
      checkingNami: false,
      keyValidationError: null
    }
    this.passwordField = null;
    this.passwordField2 = null;

    this.nextStep = this.nextStep.bind(this);
    this.lastStep = this.lastStep.bind(this);
    this.setMasterPassword = this.setMasterPassword.bind(this);
    this.saveKeys = this.saveKeys.bind(this);
  }

  /**
   * Sets the global master password and advances stepIndex if the passwordFields are equal
   */
  setMasterPassword(){
    let equal = false, pass = "";
    if(this.passwordField){
      pass = this.passwordField.input.value;
    }
    if(this.passwordField2){
      equal = pass == this.passwordField2.input.value;
    }
    if(equal){
      //set master password in global object of main process
      require("electron").remote.getGlobal("sharedObj").masterPassword = pass;

      this.setState({stepIndex: this.state.stepIndex + 1, password: pass});

    }
    else {
      this.setState({passwordsEqual: false});
    }
  }

  saveKeys(){
    let keys= {
      key: this.refMailgunKey.input.value,
      domain: this.refMailgunDomain.input.value,
      nami_user: this.refNamiUser.input.value,
      nami_pw: this.refNamiPass.input.value
    };
    let keysValid = true;
    for(let k of Object.keys(keys)){
      //check if one of the keys is falsy -> "" or null
      keysValid &= !!keys[k];
    }
    if(!keysValid){
      this.setState({keyValidationError: "Daten ungültig. Hast du alle Felder ausgefüllt?"})
      return;
    }
    if(!keys.key.startsWith("key-")){
      this.setState({keyValidationError: "Mailgun API Key ungültig. Dieser muss mit key- anfangen."})
      return;
    }
    if(keysValid){
      //check Nami Login Data
      this.setState({checkingNami: true});
      let nami = new NamiAPI(keys.nami_user, keys.nami_pw);
      nami.startSession().then((success)=>{
        //nami login data valid
        saveEncrypted(this.state.password, keys);
        this.setState({stepIndex: this.state.stepIndex + 1, checkingNami: false});
      }, (error)=>{
        this.setState({keyValidationError: "Nami Anmeldung fehlgeschlagen. Fehler: " + error, checkingNami: false})
      })
    }



  }

  nextStep(){
    let step = this.state.stepIndex;
    switch(step){
      case 1:
      this.setMasterPassword();
      break;
      case 2:
      this.saveKeys();
      break;
      case 3:
      this.props.loginComplete();
      default:
      this.setState({stepIndex: step + 1});
      break;
    }

  }

  lastStep(){
    let step = this.state.stepIndex;
    this.setState({stepIndex: step - 1})
  }

  render(){
    let body = null;
    let {stepIndex, passwordsEqual, showConfirmPasswordDelete} = this.state;

    switch(stepIndex){
      //welcome
      case 0:
      body = (<div className="setupBody">
        <h2>Herzlich willkommen beim Nami-Mailgun Sync Tool! </h2>
        In diesem Setup kannst du das Programm einrichten.
      </div>)
      break;
      //enter master password
      case 1:
      body = (
        <div className="setupBody">
          Bitte vergib ein Masterpasswort.
          <span className="infoText">
            Dieses Passwort wird zum Verschlüsseln der Mailgun und Nami Daten verwendet.
            Verlierst du dieses, müssen die gespeicherten Anmeldedaten gelöscht werden.
            Die Verschlüsselung geschieht mit dem <b>AES-256-CTR</b> Algorithmus.
            <br />
            Alle Daten bleiben auf deinem PC gespeichert und werden nur an Mailgun und die Nami übertragen.
          </span>
          <br/>
          <TextField type="password" hintText="Masterpasswort" ref={component => {this.passwordField = component}} />
          <br />
          <TextField type="password" hintText="Passwort wiederholen" ref={component => {this.passwordField2 = component}} errorText={(!passwordsEqual) ? "Die Passwörter stimmen nicht überein" : ""}/>
          <br />
        </div>
      )
      break;
      //enter Nami and Mailgun data
      case 2:
      body = (
        <div className="setupBody">
          <h2>API und Nami Info</h2>
          <TextField
          ref={element => {this.refMailgunKey = element}}
          className="textField"
          floatingLabelText="Mailgun API Key"
          floatingLabelFixed={true}/>
          <TextField
          ref={element => {this.refMailgunDomain = element}}
          className="textField"
          floatingLabelText="Mailgun Domain"
          floatingLabelFixed={true}/>
          <br />
          <TextField
          ref={element => {this.refNamiUser = element}}
          className="textField"
          floatingLabelText="Nami Benutzername"
          floatingLabelFixed={true}/>
          <TextField
          ref={element => {this.refNamiPass = element}}
          className="textField"
          floatingLabelText="Nami Passwort"
          floatingLabelFixed={true}
          key="keys_pass"
          type="password"/>
          <br />
          <Snackbar open={this.state.checkingNami} message="Überprüfe Nami Anmeldedaten" />
          {(this.state.keyValidationError) ? (<span className="errorMessage">{this.state.keyValidationError}</span>) : (null)}
        </div>
      );
      break;

      case 3:
      default:
      body = (
        <div className="setupBody">
          <h2>Profit!</h2>
          Die Einrichtung ist abgeschlossen.
        </div>
      )
      break;
    }


    return(
      <MuiThemeProvider>
    <Paper className="bodyContainer setupGrid">


       <div className="setupStepper"><Stepper activeStep={this.state.stepIndex} >
          <Step><StepLabel>Willkommen</StepLabel></Step>
          <Step><StepLabel>Masterpasswort</StepLabel></Step>
          <Step><StepLabel>Nami und Mailgun Daten.</StepLabel></Step>
          <Step><StepLabel>Das war's auch schon</StepLabel></Step>
        </Stepper>
        </div>


      {body}


        <div className="setupButtons">
          <RaisedButton className="setupButtons-left" secondary={true} label="Zurück" disabled={stepIndex == 0} onClick={this.lastStep}/>
          <RaisedButton className="setupButtons-right"primary={true} label={(stepIndex == 3) ? "Fertig" : "Weiter"} onClick={this.nextStep}/>
        </div>

    </Paper>
    </MuiThemeProvider>
    )
  }
}
