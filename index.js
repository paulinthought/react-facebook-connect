import React from 'react';
import ReactDOM from 'react-dom';
import loader from './fb-init';
import moment from 'moment';

export default class FBConnectComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      ready: false,
      status: 'unknown', 
      accessToken: undefined,
      expires: undefined,
      user: undefined 
    }
  }

  componentWillMount() {
    if (!this.state.ready) {
      loader.then(() => {
        FB.init({
          appId      : 'YOUR_APP_ID',
          xfbml      : true,
          version    : 'v2.3'
        }); 
        this.setState({ ready: true });
      })
      .catch(err => (console.log('error', err)));
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.status !== this.state.status || nextState.ready !== this.state.ready;
  }

  completeLogin(response) {
    if (response.status === 'connected') {
      FB.api('/me', function(userInfo) {
        console.log('Successful login for: ' + userInfo.name, this);
        if (typeof userInfo.email === 'undefined') {
            // TODO: Error, Tell the user we want their email 
        } else {
          this.setState({
            status: 'connected',
            accessToken: response.authResponse.accessToken,
            expires: moment().add(response.authResponse.expiresIn, 'milliseconds'),
            user: userInfo
          });
          if (typeof this.props.callback !== 'undefined') {
            this.props.callback(userInfo);
          }
        }      
      }.bind(this));
    } else {
      this.setState({
        status: response.status,
        accessToken: undefined,
        expires: undefined,
        user: undefined
      });
    }
  }

  loginToFB() {
    console.log('Component.checkLoginState')
    FB.login((response) => {
      console.log('logging into FB', this, response)
      this.completeLogin(response)
    }, {scope: 'public_profile,email'});        
  }

  logout() {
    this.setState({ 
      status: 'unknown', 
      accessToken: undefined,
      expires: undefined,
      username: undefined 
    });
  }
  
  render() {

    let buttonLabel = this.state.status === 'connected' ? 'Logout' : 'Connect';
    let loginState;
    
    switch (this.state.status) {
      case 'connected':
        loginState = (
          <div>
            <button onClick={this.logout.bind(this)}>
              {buttonLabel}
            </button>
            <span>Welcome {this.state.user.first_name}</span>
          </div>
        );
        break; 

      case 'not_authorized':     
      case 'pending':
        loginState = (
          <button scope='public_profile,email' onClick={this.loginToFB.bind(this)}>
            {buttonLabel}
          </button>
        );
        break;

      case 'disconnected':
      case 'unknown':
      default:
        loginState = (
          <button scope='public_profile,email' onClick={this.loginToFB.bind(this)}>
            {buttonLabel}
          </button>
        );
    }   

    return this.state.ready ? (<div>{loginState}</div>) : (<span>Waiting for Facebook</span>);
  }
 
}

ReactDOM.render(
  <FBConnectComponent key='appRootContainer' />,
  document.getElementById('app')
);