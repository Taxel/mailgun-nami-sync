import React from 'react';
import secret_keys from './lib/keys.json';
import NamiAPI from './lib/nami.js';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import {List, ListItem, DropDownMenu, MenuItem, Toggle, Paper} from 'material-ui';

export default class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      namiInitialized: false,
      namiData: null,
      stufe: 1,
      leiter: true
    }
    this.nami = new NamiAPI(secret_keys.nami_user, secret_keys.nami_pw);
    this.nami.startSession().then((success)=>{this.setState({namiInitialized: true}); this.namiSearch(this.state.stufe, this.state.leiter)}, (error)=>{console.error(error)});
    this.namiSearch = this.namiSearch.bind(this);
    this.changeStufe = this.changeStufe.bind(this);
  }
  sendMail(){
    var mailgun = require('mailgun-js')({apiKey: secret_keys.key, domain: secret_keys.domain});

    var data = {
      "from": "Mailgun Sandbox <postmaster@sandboxc2ea7d6c06b340e7a5336b0576e55bed.mailgun.org>",
      "to": "Alexander Theimer <aalex@dpsg-kaufering.de>",
      "subject": "Hello Alexander Theimer",
      "text": "Congratulations Alexander Theimer, you just sent an email with Mailgun!  You are truly awesome!"
    };

    mailgun.messages().send(data, function (error, body) {
      console.log(body);
    });
  }

  namiSearch(stufe, leiter){
    this.nami.listMembers(stufe, leiter).then((data)=>{
      console.log(data)
      this.setState({namiData: data.map((elem)=>{
        return elem.descriptor + "\t" + elem.entries_email;
      }),
    stufe: stufe,
  leiter: leiter})
    }, (error)=>{console.error(error)});
  }

  changeStufe(event, index, value) {
    this.namiSearch(value, this.state.leiter)
  }

  render() {
    let namiData = null;
    if(this.state.namiData){
      namiData = this.state.namiData.map((elem, i)=>(<ListItem key={i}>{elem}</ListItem>))
    }
    let stufen = [];
    for(let stufe in NamiAPI.Stufe){
      stufen.push((<MenuItem primaryText={stufe} value={NamiAPI.Stufe[stufe]} key={NamiAPI.Stufe[stufe]}/>))
    }
    return (<MuiThemeProvider>


      {(this.state.namiInitialized) ? (
        <div>
         <DropDownMenu value={this.state.stufe} onChange={this.changeStufe}>
         {stufen}
       </DropDownMenu>
       <Toggle label="Leiter" toggled={this.state.leiter} onToggle={()=>{this.namiSearch(this.state.stufe, !this.state.leiter)}}/>
       <Paper style={{maxHeight: "80vh", overflow: 'auto'}}>
     <List>
       {namiData}
     </List>
     </Paper>

     </div>
    ) : (<span>Nami lädt...</span>)}


    </MuiThemeProvider>);
  }
}
