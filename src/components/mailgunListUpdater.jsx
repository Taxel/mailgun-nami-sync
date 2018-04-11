import React from 'react';
import NamiAPI from '../lib/nami.js';
import {FlatButton, Dialog, Snackbar, RaisedButton, Toggle, MenuItem, DropDownMenu, Table, TableRow, TableRowColumn, Paper, TextField, Divider} from 'material-ui';
import {loadEncrypted} from '../lib/keysEncryptor.js';

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
    this.getFormData = this.getFormData.bind(this);

    this.secret_keys = loadEncrypted(require('electron').remote.getGlobal("sharedObj").masterPassword);

    this.mailgun = require('mailgun-js')({apiKey: this.secret_keys.key, domain: this.secret_keys.domain})

    this.textFieldRefs = {};

    this.state = {
      working: 0,
      loading: true,
      mailingLists: null,
      dialogOpen: false,
      newList: {
        name: "",
        stufe: "",
        leiter: true
      }
    }
  }

  getFormData(){
    let formData = this.state.mailingLists.slice();
    for(let i = 0; i < formData.length; i++){
      formData[i].name = this.textFieldRefs[i].input.value;
    }
    return formData;
  }

  /**
   * OnChange callback so the state is dynamically updated with every change
   * @param {*} index
   * @param {*} name
   * @param {*} stufe
   * @param {*} leiter
   */
  editMailingList(index, name, stufe, leiter) {
    let newState = this.state.mailingLists;
    newState[index] = {name: name, stufe: stufe, leiter: leiter};
    this.setState({mailingLists: newState});
  }

  /**
   * Same as editMailingList, except that it updates the new mailing list, which is not yet added (the one at the bottom)
   * @param {*} name
   * @param {*} stufe
   * @param {*} leiter
   */
  editNewMailingList(name, stufe, leiter) {
    let newState = this.state.newList;
    newState = {name: name, stufe: stufe, leiter: leiter};
    this.setState({newList: newState});
  }


  componentDidMount(){
    this.setState({mailingLists: this.readListsSync(), loading: false});
  }

  /**
   * Reads the mailing lists from ../mailinglists.json, parses and returns them (Array of Objects [{name, stufe, leiter}])
   */
  readListsSync(){
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../mailingLists.json'), 'utf8'));
  }

  /**
   * Executed when the "Sync Mailing lists with Nami" button is clicked.
   * First checks if the current form data differ from the ones written to file
   * If yes, displays a dialog with the choices to apply or revert those changes
   */
  onSyncButtonClick(){
    //check if this.state.mailingLists === readListsSync()
    let currentFormData = this.getFormData();
    let oldData = this.readListsSync();
    let hasDataChanged = oldData.length != currentFormData.length;
    for(let i = 0; i < currentFormData.length; i++){
      let l1 = currentFormData[i], l2 = oldData[i];
      hasDataChanged |= l1.name != l2.name || l1.stufe != l2.stufe || l1.leiter != l2.leiter;
    }
    if(hasDataChanged){
      this.setState({dialogOpen: true});
    }
    else {
      this.setState({working: true});
      this.updateAllLists();
    }
  }

  /**
   * Resets the currently displayed lists to the ones in the json file
   */
  dismissChanges(){
    this.setState({
      mailingLists: this.readListsSync(),
      dialogOpen: false,
      working: this.state.mailingLists.length
    }, this.updateAllLists)

  }

  /**
   * Saves current lists to file
   */
  saveChanges(){
    fs.writeFile(path.join(__dirname, '../mailingLists.json'), JSON.stringify(this.getFormData()), 'utf8', (err)=> {
      if (err) throw err;
    });
    this.setState({
      dialogOpen: false,
      working: this.state.mailingLists.length
    }, this.updateAllLists);
  }

  /**
   * Syncs all Lists between Mailgun and Nami.
   * Creates non existent lists.
   */
  updateAllLists(){
    let listData = this.getFormData();

    for(let lst of listData){
      let address = `${lst.name}@${this.secret_keys.domain}`;
      this.mailgun.lists().info().then((data)=>{
        // if the promise is not rejected the list exists.
        // update the list
        this.updateList(lst.name, lst.stufe, lst.leiter);
      }, (error)=>{
        // if there is an error, the list does not exist.
        // create it
        this.mailgun.lists().create({access_level: "everyone", address:address, description: "Erstellt mit dem Mailgun Nami Sync Tool", name: lst.name}).then((data)=>{
          //list was created successfully
          //update it
          this.updateList(lst.name, lst.stufe, lst.leiter);
        }, (error)=>{
          console.error(error);
        })
      })
    }
  }

  /**
   * Syncs a single List between Mailgun and Nami.
   * Stufe and Leiter are the Nami Search Params.
   * @param {*} listName Name of the mailgun mailing list WITHOUT the domain (stavos instead of stavos@dpsg-kaufering.de)
   * @param {*} stufe NamiAPI.Stufe object (one of [0, 1, 2, 3, 4, 5, 6])
   * @param {*} leiter Bool. If only group leaders should be searched for
   */
  updateList(listName, stufe, leiter){

    listName += "@" + this.secret_keys.domain;

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
    this.textFieldRefs = {};
    let mailingListElements = mailingLists.map((elem, i)=>{
      return (
        <TableRow key={elem.name}>
          <TableRowColumn><TextField name={"txtField_" + i} defaultValue={elem.name} className="textFieldList" ref={component=>{this.textFieldRefs[i] = component}}/></TableRowColumn>
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

    return (
      <div className="setupGrid">
        <Paper className="scrollable contentWithFooter">
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

    <RaisedButton className="footer" primary={true} label="Mailgun Listen mit Nami synchronisieren" onClick={this.onSyncButtonClick}/>

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
