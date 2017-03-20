import React from 'react';

class App extends React.Component {
   render() {
      return (
        <div style={{display: 'none'}}>
              <iframe src={this.props.link} />
          </div>
      );
   }
}

export default App;
