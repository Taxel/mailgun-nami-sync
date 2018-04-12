import React from 'react';
import {loadEncrypted} from '../lib/keysEncryptor.js';
import NamiAPI from '../lib/nami.js';

import WelcomePage from './welcomePage';
import NamiViewer from './namiViewer.jsx';
import MailgunListUpdater from './mailgunListUpdater.jsx';
import ConfigPage from './configPage.jsx';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Paper, CircularProgress, Drawer, AppBar } from 'material-ui';
import { MenuItem } from 'material-ui/DropDownMenu';


export default class MainPage extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      drawerOpen: false,
      currentPage: 0,
      namiLoaded: false,
      namiError: ""
    }

    this.reloadKeyFile = this.reloadKeyFile.bind(this);

    this.reloadKeyFile();

  }

  componentDidMount(){
    console.log("component did mount; loading Nami");
    window.nami = new NamiAPI(this.secret_keys.nami_user, this.secret_keys.nami_pw);
    window.nami.startSession().then((success)=>this.setState({namiLoaded: true}), (error)=>this.setState({namiError: error}));

  }

  reloadKeyFile(){
    this.secret_keys = loadEncrypted(require("electron").remote.getGlobal('sharedObj').masterPassword)
  }




  render() {
    let body = null;

    if(!this.state.namiLoaded){
      if(this.state.namiError){
        body= (<Paper className="body"><span className="errorMessage">Nami Fehler: <br />{this.state.namiError}</span>
        <h3>Bitte überprüfe die Anmeldedaten zur NaMi:</h3>
          <ConfigPage reloadKeyFile={this.reloadKeyFile}/>
        </Paper>)
      }else{
      body = (<Paper className="body"><span style={{textAlign: "center"}}>Nami l&auml;dt...<CircularProgress /></span></Paper>);
      }
    }else{
      switch(this.state.currentPage){
        case 0:
          body = (<WelcomePage />);
          break;
        case 1:
          body = (<NamiViewer />);
          break;
        case 2:
          body = (<MailgunListUpdater />);
          break;
        case 3:
          body = (<ConfigPage reloadKeyFile={this.reloadKeyFile}/>);
          break;
        default:
          console.error("Invalid currentPage: " + this.state.currentPage)
          break;
      }

    }


    return (<MuiThemeProvider>
      <div>
        <AppBar
          title="Nami Mailgun Synch"
          iconClassNameRight="muidocs-icon-navigation-expand-more"
          onLeftIconButtonClick={()=>this.setState({drawerOpen: !this.state.drawerOpen})}
          zDepth={3}
          style={{zIndex:1700}}
        />
        <Drawer open={this.state.drawerOpen} docked={true} zDepth={2}
        containerStyle={{paddingTop: "5em"}}>
          <MenuItem onClick={()=>this.setState({currentPage: 0, drawerOpen: false})}>Willkommen</MenuItem>
          <MenuItem onClick={()=>this.setState({currentPage: 1, drawerOpen: false})}>Nami Daten Einsicht</MenuItem>
          <MenuItem onClick={()=>this.setState({currentPage: 2, drawerOpen: false})}>Mailing Listen </MenuItem>
          <MenuItem onClick={()=>this.setState({currentPage: 3, drawerOpen: false})}>Konfiguration API/Nami/Passwort </MenuItem>
        </Drawer>
          {body}
      </div>
    </MuiThemeProvider>);
  }
}
