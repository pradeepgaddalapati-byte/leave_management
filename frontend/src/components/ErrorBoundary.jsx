import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <main className="page-shell">
          <section className="card error-panel">
            <h1>Something went wrong</h1>
            <p>{this.state.error.message || 'The page could not render.'}</p>
            <button onClick={this.reset}>Try Again</button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
