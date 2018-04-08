import React from 'react';
import secret_keys from './lib/keys.json';
import NamiAPI from './lib/nami.js';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import {List, ListItem, DropDownMenu, MenuItem, Toggle, Paper, RaisedButton, CircularProgress, Toolbar, ToolbarGroup, Snackbar} from 'material-ui';
import { ToolbarTitle } from 'material-ui/Toolbar';

export default class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      namiInitialized: false,
      namiData: null,
      stufe: "",
      leiter: true,
      working: 0
    }
    this.nami = new NamiAPI(secret_keys.nami_user, secret_keys.nami_pw);
    this.nami.startSession().then((success)=>{this.namiSearch(this.state.stufe, this.state.leiter)}, (error)=>{console.error(error)});
    this.namiSearch = this.namiSearch.bind(this);
    this.changeStufe = this.changeStufe.bind(this);
    this.updateList = this.updateList.bind(this);
    this.updateAllLists = this.updateAllLists.bind(this);
    this.getNamiMailingList = this.getNamiMailingList.bind(this);
    this.mailgun = require('mailgun-js')({apiKey: secret_keys.key, domain: secret_keys.domain})
  }

  updateAllLists(){

    let listData = [
      {name: "leiterrunde", stufe: NamiAPI.Stufe.ALLE, leiter: true},
      {name: "woes", stufe: NamiAPI.Stufe.WOE, leiter: false},
      {name: "woeleiter", stufe: NamiAPI.Stufe.WOE, leiter: true},
      {name: "jupfis", stufe: NamiAPI.Stufe.JUPFI, leiter: false},
      {name: "jupfileiter", stufe: NamiAPI.Stufe.JUPFI, leiter: true},
      {name: "pfadis", stufe: NamiAPI.Stufe.PFADI, leiter: false},
      {name: "pfadileiter", stufe: NamiAPI.Stufe.PFADI, leiter: true},
      {name: "rover", stufe: NamiAPI.Stufe.ROVER, leiter: false},
      {name: "roverleiter", stufe: NamiAPI.Stufe.ROVER, leiter: true},
      {name: "stavos", stufe: NamiAPI.Stufe.STAVO, leiter: false},
      {name: "freimis", stufe: NamiAPI.Stufe.FREIMI, leiter: false}
    ]

    this.setState({working: listData.length})

    for(let lst of listData){
      this.updateList(lst.name, lst.stufe, lst.leiter);
    }
  }

  updateList(listName, stufe, leiter){

    listName += "@mg.dpsg-kaufering.de";

    this.getNamiMailingList(stufe, leiter).then((newMails)=>{
      //newMails = the mail addresses that should be in the list
      let testList = this.mailgun.lists(listName).members().list().then((oldMails)=> {
        //oldMails = the addresses that are currently in the list
        let newMembers = [], setNew = new Set(newMails.map(elem => elem.address));
        //add new mails to newMembers
        for(let m of newMails){
          newMembers.push(m);
        }
        //loop over old addresses and disable the ones that are not present in the new list
        for(let m of oldMails.items){
          if(!setNew.has(m.address)){
            m["subscribed"] = false;
            newMembers.push(m);
          }
        }

        //console.log(newMembers);
        this.mailgun.lists(listName).members().add({members: newMembers, upsert: true}).then((data)=>{
          console.log("successfully updated the mailing list " + listName);

          this.setState({working: this.state.working - 1})

        }, (err)=>{console.error(err)})
      }, function (err) {
        console.log(err);
      });

    })



  }
  /**
   * Returns promise to an array of objects with all email addresses.
   * [{address: mail@example.com, (name: sometimes)}]
   * Does not alter state
   * @param {*} stufe
   * @param {*} leiter
   */
  getNamiMailingList(stufe, leiter){
    console.log("getting Mailing List for Stufe " + stufe)
    return new Promise((resolve, reject)=>{
      this.nami.listMembers(stufe, leiter).then((data)=>{
        let mails = [];
        for(let i = 0; i < data.length; i++){
          let elem = data[i], foundAddress = false;

          if(elem.entries_email){
            mails.push({"address": elem.entries_email, "name": elem.descriptor});
            foundAddress = true;
          }
          if(elem.entries_emailVertretungsberechtigter){
            mails.push({"address": elem.entries_emailVertretungsberechtigter});
            foundAddress = true;
          }
          if(!foundAddress){
            console.warn("No email Address found for user " + elem.descriptor + ". FIX THIS IN NAMI!")
          }
        }
        resolve(mails);
      }, (error)=>{reject(error)});
    })
  }

  /**
   * Searches nami and displays results.
   * Sets state!
   * @param { } stufe
   * @param {*} leiter
   */
  namiSearch(stufe, leiter){
    this.nami.listMembers(stufe, leiter).then((data)=>{
      console.log(data)
      this.setState({namiData: data.map((elem)=>{
        let email = elem.entries_email || "";
        if(elem.entries_emailVertretungsberechtigter){
          if(email != ""){
            email += ", ";
          }
          email += elem.entries_emailVertretungsberechtigter;
        }
        return {text: `${elem.descriptor}\t <${email}>`, full: elem};
      }),
    stufe: stufe,
  leiter: leiter,
namiInitialized: true})
    }, (error)=>{console.error(error)});
  }

  changeStufe(event, index, value) {
    this.namiSearch(value, this.state.leiter)
  }

  render() {
    let namiData = null;
    if(this.state.namiData){
      let formatDate = (dateString)=>{
        return new Date(Date.parse(dateString)).toLocaleDateString('de-DE');
      }
      namiData = this.state.namiData.map((elem, i)=>(
      <ListItem key={i} nestedItems={[
        <ListItem key={1} primaryText={"Nami NR: " + elem.full.entries_mitgliedsNummer}/>,
        <ListItem key={2} primaryText={"Eintrittsdatum: " + formatDate(elem.full.entries_eintrittsdatum) + " \tGeburtsdatum: " + formatDate(elem.full.entries_geburtsDatum)}/>,
        <ListItem key={4} primaryText={"Status: " + elem.full.entries_status + "\t Mitgliedstyp: " + elem.full.entries_mglType}/>
      ]}>{elem.text}</ListItem>))
    }
    let stufen = [];
    for(let stufe in NamiAPI.Stufe){
      stufen.push((<MenuItem primaryText={stufe} value={NamiAPI.Stufe[stufe]} key={NamiAPI.Stufe[stufe]}/>))
    }
    return (<MuiThemeProvider>
      <div>
        <Toolbar style={{paddingLeft: "4em"}}>
          <ToolbarGroup firstChild={true}>
          <ToolbarTitle text="Stufe ausw&auml;hlen: " />
          <DropDownMenu value={this.state.stufe} onChange={this.changeStufe}>
         {stufen}
       </DropDownMenu>
          </ToolbarGroup>
          <ToolbarGroup><Toggle label="Leiter" toggled={this.state.leiter} onToggle={()=>{this.namiSearch(this.state.stufe, !this.state.leiter)}}/>
       </ToolbarGroup>
          <ToolbarGroup>
    <RaisedButton label="Update Mailgun lists" primary={true} onClick={this.updateAllLists} disabled={(this.state.working > 0)}/>
    </ToolbarGroup>
        </Toolbar>

      {(this.state.namiInitialized) ? (
        <div>

       <Paper style={{maxHeight: "80vh", overflow: 'auto'}}>
     <List>
       {namiData}
     </List>
     </Paper>
     <span style={{padding: "1em", display: "inline-block", fontSize: "small"}}>{namiData.length} Eintr&auml;ge gefunden</span>

     </div>
    ) : (<Paper><span style={{margin: "0 auto"}}>Nami l&auml;dt...<CircularProgress /></span></Paper>)}
    <Snackbar
          open={this.state.working > 0}
          message="Working..."
          autoHideDuration={10000}
        />
    </div>
    </MuiThemeProvider>);
  }
}
