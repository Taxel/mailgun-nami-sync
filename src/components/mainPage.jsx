import React from 'react';
import secret_keys from '../lib/keys.json';
import NamiAPI from '../lib/nami.js';

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
      currentPage: 1,
      namiLoaded: false
    }
    window.nami = new NamiAPI(secret_keys.nami_user, secret_keys.nami_pw);
    window.nami.startSession().then((success)=>this.setState({namiLoaded: true}), (error)=>console.error(error));

  }





  render() {
    let body = null;
    if(!this.state.namiLoaded){
      body = (<Paper><span style={{textAlign: "center"}}>Nami l&auml;dt...<CircularProgress /></span></Paper>);
    }else{
      switch(this.state.currentPage){
        case 1:
          body = (<NamiViewer />);
          break;
        case 2:
          body = (<MailgunListUpdater />);
          break;
        case 3:
          body = (<ConfigPage />);
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
          <MenuItem onClick={()=>this.setState({currentPage: 1, drawerOpen: false})}>Nami Data</MenuItem>
          <MenuItem onClick={()=>this.setState({currentPage: 2, drawerOpen: false})}>Mailing Lists </MenuItem>
          <MenuItem onClick={()=>this.setState({currentPage: 3, drawerOpen: false})}>Konfiguration </MenuItem>
        </Drawer>
        {body}
      </div>
    </MuiThemeProvider>);
  }
}
