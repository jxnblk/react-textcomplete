/** @jsx React.DOM */

// WIP - Do not use this (yet)

// To do:
// - regex match
// - multiple strategies
// - handle return characters
// - handle key events
// - positioning based on cursor

var React = require('react');
var fuzzy = require('fuzzy');

module.exports = React.createClass({

  getInitialState: function() {
    return {
      value: this.props.value,
      words: {},
      currentWord: 0,
      cursorPosition: 0,
      matches: []
    }
  },

  fuzzyMatch: function(string) {
    var results = fuzzy.filter(string, this.props.list);
    var matches = [];
    results.map(function(result) {
      if (result.score > 0) {
        matches.push(result.string);
      }
    });
    this.setState({ matches: matches });
    return matches;
  },

  parseWords: function(string) {
    var words = string.split(' ');
    var position = 0;
    words.map(function(word, i) {
      var wordobj = {
        start: position,
        length: word.length,
        end: position + word.length,
        value: word
      };
      position += (word.length + 1);
      words[i] = wordobj;
    });
    this.setState({ words: words });
    return words;
  },

  setCurrentWord: function(words, position) {
    var currentWord = 0;
    words.map(function(word, i) {
      if (position >= word.start && position <= word.end) {
        currentWord = i;
      }
    });
    this.setState({ currentWord: currentWord });
    return currentWord;
  },

  findMatches: function(string) {
    var position = this.state.cursorPosition;
    var words = this.parseWords(string);
    var matches;
    var currentWord = this.setCurrentWord(words, position);
    matches = this.fuzzyMatch(words[currentWord].value);
    this.setState({ matches: matches });
  },

  completeWord: function(word) {
    var words = this.state.words;
    var value = '';
    words[this.state.currentWord].value = word;
    words.map(function(word) {
      value += word.value + ' ';
    });
    this.setState({
      value: value,
      matches: []
    });
  },

  handleChange: function(e) {
    var self = this;
    var value = e.target.value;
    this.setState({
      value: value,
      cursorPosition: e.target.selectionStart
    }, function() {
      self.findMatches(value);
      self.props.onChange(value);
    });
  },

  handleKeyDown: function(e) {
    var textarea = this.refs.textarea.getDOMNode();
    var multiselect = this.refs.multiselect.getDOMNode();
    var firstOption = multiselect.querySelector('option');
    switch (e.which) {
      case 40:
        multiselect.focus();
        multiselect.selectedIndex = 0;
        break;
    }
  },

  render: function() {
    var self = this;
    var renderOptions = function(val) {
      return (
        <option value={val}>{val}</option>
      );
    };
    var selectStyle = {
      display: this.state.matches.length ? '' : 'none'
    };
    var handleSelection = function(e) {
      e.preventDefault();
      console.log('selected', e.target.value);
      self.completeWord(e.target.value);
    };

    return (
      <div className="mb4">
        {/* Pass parent props */}
        <textarea
          className="form-control"
          ref="textarea"
          value={this.state.value}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
        />
        {/* Use ul with links */}
        <select multiple
          ref="multiselect"
          style={selectStyle}
          onChange={handleSelection}
          className="form-control">
          {this.state.matches.map(renderOptions)}
        </select>
      </div>
    )
  }

});

