import React from 'react';

import MainPage from './components/mainPage.jsx';
import LoginPage from './components/loginPage.jsx';
import SetupPage from './components/setupPage.jsx';

import {doesEncryptedFileExist} from './lib/keysEncryptor.js';

export default class App extends React.Component {
  constructor(props){
    super(props);
    let masterPassword = require("electron").remote.getGlobal("sharedObj").masterPassword;
    this.state = {
      loggedIn: masterPassword != null,
      showSetup: !doesEncryptedFileExist()
    }

    this.onLoginComplete = this.onLoginComplete.bind(this);
  }

  onLoginComplete(){
    this.setState({loggedIn: true, showSetup: false});
  }





  render() {
    if(this.state.loggedIn){
      return (<MainPage />)
    }else{
      if(this.state.showSetup){
        return (<SetupPage loginComplete={this.onLoginComplete}/>)
      }else{
        return (<LoginPage loginComplete={this.onLoginComplete} gotoSetup={()=>this.setState({showSetup: true})}/>);
      }
      }

  }
}
