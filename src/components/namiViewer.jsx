import React from 'react';
import NamiAPI from '../lib/nami.js';
import secret_keys from '../lib/keys.json'

import {List, ListItem, DropDownMenu, MenuItem, Toggle, Paper, CircularProgress, Toolbar, ToolbarTitle, ToolbarGroup, Snackbar} from 'material-ui';


export default class NamiViewer extends React.Component {
  constructor(props){
    super(props);

    this.namiSearch = this.namiSearch.bind(this);
    this.changeStufe = this.changeStufe.bind(this);

    this.nami = window.nami;
    this.nami.startSession().then((success)=>{this.namiSearch(NamiAPI.Stufe.ALLE, true)}, (error)=>{console.error(error)});

    this.state = {
      stufe: NamiAPI.Stufe.ALLE,
      leiter: true,
      namiData: null,
      namiInitialized: false
    }
  }

  /**
   * Searches nami and displays results.
   * Sets state!
   * @param { } stufe
   * @param {*} leiter
   */
  namiSearch(stufe, leiter){
    this.nami.listMembers(stufe, leiter).then((data)=>{
      //console.log(data)
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

  render(){
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
    }else{
      return null
    }
    let stufen = [];
    for(let stufe in NamiAPI.Stufe){
      stufen.push((<MenuItem primaryText={stufe} value={NamiAPI.Stufe[stufe]} key={NamiAPI.Stufe[stufe]}/>))
    }
    return (
      <div>
        <Toolbar style={{paddingLeft: "4em"}}>
          <ToolbarGroup firstChild={true}>
            <ToolbarTitle text="Stufe ausw&auml;hlen: " />
            <DropDownMenu value={this.state.stufe} onChange={this.changeStufe}>
              {stufen}
            </DropDownMenu>
          </ToolbarGroup>
          <ToolbarGroup>
            <Toggle label="Leiter" toggled={this.state.leiter} onToggle={()=>{this.namiSearch(this.state.stufe, !this.state.leiter)}}/>
          </ToolbarGroup>
        </Toolbar>


        <div>

          <Paper style={{maxHeight: "80vh", overflow: 'auto'}}>
            <List>
              {namiData}
            </List>
          </Paper>
          <span style={{padding: "1em", display: "inline-block", fontSize: "small"}}>{namiData.length} Eintr&auml;ge gefunden</span>

        </div>
      </div>
    )
  }
}
