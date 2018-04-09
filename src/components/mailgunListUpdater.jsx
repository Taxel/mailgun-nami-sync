import React from 'react';
import NamiAPI from '../lib/nami.js';
import {FlatButton, Dialog, Snackbar, RaisedButton, Toggle, MenuItem, DropDownMenu, Table, TableRow, TableRowColumn, Paper, TextField, Divider} from 'material-ui';
import secret_keys from '../lib/keys.json';

import fs from 'fs';
import path from 'path';

import TableBody from 'material-ui/Table/TableBody';
import TableHeader from 'material-ui/Table/TableHeader';
import TableHeaderColumn from 'material-ui/Table/TableHeaderColumn';

export default class MailgunListUpdater extends React.Component {
  constructor(props){
    super(props);


    this.nami = window.nami;
    this.updateList = this.updateList.bind(this);
    this.updateAllLists = this.updateAllLists.bind(this);
    this.getNamiMailingList = this.getNamiMailingList.bind(this);
    this.editMailingList = this.editMailingList.bind(this);
    this.readListsSync = this.readListsSync.bind(this);
    this.dismissChanges = this.dismissChanges.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.onSyncButtonClick = this.onSyncButtonClick.bind(this);

    this.mailgun = require('mailgun-js')({apiKey: secret_keys.key, domain: secret_keys.domain})

    this.state = {
      working: 0,
      loading: true,
      mailingList: null,
      dialogOpen: false,
      newList: {
        name: "",
        stufe: "",
        leiter: true
      }
    }
  }

  editMailingList(index, name, stufe, leiter) {
    let newState = this.state.mailingLists;
    newState[index] = {name: name, stufe: stufe, leiter: leiter};
    this.setState({mailingLists: newState});
  }

  editNewMailingList(name, stufe, leiter) {
    let newState = this.state.newList;
    newState = {name: name, stufe: stufe, leiter: leiter};
    this.setState({newList: newState});
  }

  componentDidMount(){
    fs.readFile(path.join(__dirname, '../mailingLists.json'), 'utf8', (err, data)=> {
      if (err) throw err;
      let newState = {mailingLists: JSON.parse(data), loading: false};
      this.setState(newState);
    });
  }

  readListsSync(){
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../mailingLists.json'), 'utf8'));
  }

  onSyncButtonClick(){
    //TODO: check if this.state.mailingLists === readListsSync()
    if(true){
      this.setState({dialogOpen: true});
    }
    else {
      this.setState({working: true});
      this.updateAllLists();
    }
  }

  dismissChanges(){
    this.setState({
      mailingLists: this.readListsSync(),
      dialogOpen: false,
      working: this.state.mailingLists.length
    })
    this.updateAllLists();
  }

  saveChanges(){
    fs.writeFile(path.join(__dirname, '../mailingLists.json'), JSON.stringify(this.state.mailingLists), 'utf8', (err)=> {
      if (err) throw err;
    });
    this.setState({
      dialogOpen: false,
      working: this.state.mailingLists.length
    })
    this.updateAllLists();
  }

  updateAllLists(){

    let listData = this.state.mailingLists;

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

  render(){
    let {mailingLists, loading, working, dialogOpen, newList} = this.state;
    if(loading){
      return (
        <Paper>
          Lese Config Dateien...
        </Paper>)
    }

    let stufen = [];
    for(let stufe in NamiAPI.Stufe){
      stufen.push((<MenuItem primaryText={stufe} value={NamiAPI.Stufe[stufe]} key={NamiAPI.Stufe[stufe]}/>))
    }

    let mailingListElements = mailingLists.map((elem, i)=>{
      return (
        <TableRow key={elem.name}>
          <TableRowColumn><TextField defaultValue={elem.name} className="textFieldList" onChange={(event, value)=>{this.editMailingList(i, value, elem.stufe, elem.leiter)}}/></TableRowColumn>
          <TableRowColumn><DropDownMenu value={elem.stufe} className="dropDownList" onChange={(event, index, value)=>{this.editMailingList(i, elem.name, value, elem.leiter)}}>
        {stufen}
      </DropDownMenu></TableRowColumn>
      <TableRowColumn><Toggle toggled={elem.leiter} className="toggleList" onToggle={()=>{this.editMailingList(i, elem.name, elem.stufe, !elem.leiter)}}/></TableRowColumn>
      <TableRowColumn><RaisedButton label="-" secondary={true} onClick={()=>{
        let newMailingLists = mailingLists.slice();
        newMailingLists.splice(i, 1);
        this.setState({mailingLists: newMailingLists});
      }}/></TableRowColumn></TableRow>
    )
    })
    console.log(mailingLists)

    return (
      <div>
        <Paper className="scrollable">
    <h2>Mailing Listen</h2>
      <Table>
        <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
          <TableRow>
          <TableHeaderColumn>Name</TableHeaderColumn>
          <TableHeaderColumn>Stufe</TableHeaderColumn>
          <TableHeaderColumn>Leiter?</TableHeaderColumn>
          <TableHeaderColumn>Löschen/Hinzufügen</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
      {mailingListElements}

        <TableRow>
          <TableRowColumn><TextField defaultValue={newList.name} hintText="Name" className="textFieldList" onChange={(event, value)=>{this.editNewMailingList(value, newList.stufe, newList.leiter)}}/></TableRowColumn>
          <TableRowColumn><DropDownMenu value={newList.stufe} className="dropDownList" onChange={(event,index, value)=>{this.editNewMailingList(newList.name, value, newList.leiter)}}>
        {stufen}
      </DropDownMenu></TableRowColumn>
          <TableRowColumn><Toggle toggled={newList.leiter} className="toggleList" onToggle={()=>this.editNewMailingList(newList.name, newList.stufe, !newList.leiter)}/></TableRowColumn>
          <TableRowColumn><RaisedButton label="+" primary={true} onClick={()=>{
            let newMailingLists = this.state.mailingLists.slice();
            newMailingLists.push(newList);
            this.setState({mailingLists: newMailingLists, newList: {name: "", stufe: "", leiter: true}});
          }}/></TableRowColumn>
        </TableRow>
      </TableBody>
      </Table>
    </Paper>
    <RaisedButton primary={true} label="Update Mailgun Lists" onClick={this.onSyncButtonClick}/>

        <Snackbar
          open={working > 0}
          message="Aktualisiere Mailinglisten..."
          autoHideDuration={10000}
        />
        <Dialog
          title="Änderungen erkannt"
          actions={[
            <FlatButton
              label="Speichern"
              primary={true}
              onClick={this.saveChanges}
            />,
            <FlatButton
              label="Verwerfen"
              secondary={true}
              onClick={this.dismissChanges}
            />,
          ]}
          modal={true}
          open={dialogOpen}
        >
          Du hast die Mailing Listen geändert. Willst du die Änderungen speichern oder verwerfen?
        </Dialog>
      </div>
    )
  }
}
