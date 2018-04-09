import React from 'react';

import MainPage from './components/mainPage.jsx';


export default class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      loggedIn: true
    }
}





  render() {
    if(this.state.loggedIn){
      return (<MainPage />)
    }

  }
}
