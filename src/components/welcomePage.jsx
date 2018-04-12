import React from 'react';
import NamiAPI from '../lib/nami.js';
import _ from 'lodash';

import {Paper} from 'material-ui';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';
import {Doughnut} from 'react-chartjs-2';

String.prototype.capitalize = function() {
  return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

// TODO add "Stufe(n)" and "Leiter" state

export default class WelcoemPage extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      leiter: true,
      namiData: null,
      namiInitialized: false,
      columns: [
        'entries_vorname',
        'entries_nachname',
        'entries_email',
        'entries_eintrittsdatum',
        'entries_geburtsDatum',
        'entries_geschlecht',
        'entries_mitgliedsNummer',
        'entries_mglType',
        'entries_status'
      ],
      genderGraph: {
        labels: [
          'männlich',
          'weiblich',
          'other'
        ],
        datasets: [{
          data: [],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56'
          ],
          hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56'
          ]
        }]
      }
    }
  }

  componentDidMount(){
    this.nami = window.nami;
    this.nami.startSession().then(()=>{this.namiSearch(NamiAPI.Stufe.ALLE, null)}, (error)=>{console.error(error)});
  }

  /**
   * Searches nami and displays results.
   * Sets state!
   * @param {NamiAPI.Stufe} stufe
   * @param {*} leiter
   */
  namiSearch(stufe, leiter){
    this.nami.listMembers(stufe, leiter).then((data)=>{
      const genderGraph = this.state.genderGraph;
      const gd = [0,0];
      data.forEach(e => {
        console.log(e);
        if (e.entries_geschlecht === genderGraph.labels[0]) {
          gd[0] = ++gd[0];
        } else if (e.entries_geschlecht === genderGraph.labels[1]) {
          gd[1] = ++gd[1];
        } else {
          gd[2] = ++gd[2];
        }
      });
      genderGraph.datasets[0].data = gd;
      this.setState({
        namiData: data,
        stufe: stufe,
        leiter: leiter,
        namiInitialized: true,
        genderDatasets: genderGraph
      });
    }, (error)=>{console.error(error)});
  }

  render(){
    const { namiData, columns, genderGraph } = this.state;
    console.log('genderGraph', genderGraph);
    console.log('namiData', namiData);
    return (
      <Paper style={{maxHeight: "calc(100vh - 64px)", overflow: 'auto'}}>
      <div style={{margin: '40px'}}>
        <div style={{maxWidth: '640px'}}>
          <Doughnut data={genderGraph} />
        </div>
        <div style={{marginTop: '40px'}}>
          <BootstrapTable ref='table' data={namiData} version='4' pagination>
            {columns.map((key, i) => {
              return <TableHeaderColumn key={i} isKey={i === 0} dataField={key} sortFunc={this.handleSort} dataSort>{key.replace('entries_', '').replace('_', ' ').capitalize()}</TableHeaderColumn>;
            })}
          </BootstrapTable>
        </div>
      </div>
      </Paper>
    )
  }
}
