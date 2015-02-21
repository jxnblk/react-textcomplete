
// WIP - Do not use this (yet)

// To do:
// - [ ] regex match
// - [ ] multiple strategies
// - [ ] handle multiple lines
// - [ ] handle key events
//   - [x] up/down to select
//   - [x] return to complete
//   - [ ] esc to cancel autocomplete
//   - [ ] tab to complete
// - [~] positioning based on cursor (copypastad from github)
// - [ ] prop for max number of matches to show in menu list

var React = require('react');
var fuzzy = require('fuzzy');
try {
  var caret = require('./lib/caret-position');
} catch(e) {
  var caret = false;
}

module.exports = React.createClass({

  getInitialState: function() {
    return {
      value: this.props.value,
      words: [],
      currentWord: 0,
      cursorPosition: 0,
      matches: [],
      selectedMatch: -1,
      anchor: {
        top: 0,
        left: 0,
      }
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
    // Split lines separately
    //var words = string.split(/[\n\r\s]+/);
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
    if (!this.state.matches.length) {
      this.getCaretPosition();
    }
    this.setState({ matches: matches });
  },

  getCaretPosition: function() {
    if (!caret) { return false }
    var $textarea = this.refs.textarea.getDOMNode();
    var coordinates = caret($textarea, $textarea.selectionEnd);
    this.setState({ anchor: coordinates });
  },

  completeWord: function(word) {
    var words = this.state.words;
    var value = '';
    var $textarea = this.refs.textarea.getDOMNode();
    //var windowYPosition = window.pageYOffset;
    words[this.state.currentWord].value = word;
    words.map(function(word) {
      value += word.value + ' ';
    });
    this.setState({
      value: value,
      matches: [],
      selectedMatch: -1,
    }, function() {
      $textarea.focus();
      //window.scrollTo(0, windowYPosition);
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

  selectNextMatch: function() {
    var index = this.state.selectedMatch;
    if (index < this.state.matches.length - 1) {
      index++;
    }
    this.setState({ selectedMatch: index });
    return index;
  },

  selectPreviousMatch: function() {
    var index = this.state.selectedMatch;
    if (index > 0) {
      index--;
    }
    this.setState({ selectedMatch: index });
    return index;
  },

  handleKeyDown: function(e) {
    var textarea = this.refs.textarea.getDOMNode();
    var menu = this.refs.menu.getDOMNode();
    var links = menu.querySelectorAll('a');
    var index = this.state.selectedMatch;
    var windowYPosition = window.pageYOffset;
    switch (e.which) {
      case 40:
        e.preventDefault();
        var index = this.selectNextMatch();
        var link = links.item(index);
        link.focus();
        window.scrollTo(0, windowYPosition);
        break;
      case 38:
        e.preventDefault();
        var index = this.selectPreviousMatch();
        var link = links.item(index);
        link.focus();
        window.scrollTo(0, windowYPosition);
        break;
    }
  },

  render: function() {
    var self = this;
    var renderItems = function(val, i) {
      var key = 'match-' + i;
      var handleClick = function(e) {
        self.completeWord(e.target.innerText);
      };
      var isActive = (self.state.selectedMatch == i);
      var linkClass = 'xlist-group-item ';
      if (isActive) {
        linkClass += 'active';
      }
      var linkStyle = {
        display: 'block',
        lineHeight: '2',
        padding: '0 5px',
        backgroundColor: isActive ? 'blue' : '',
        color: isActive ? 'white' : '',
      };
      return (
        <a href="#!"
          key={key}
          ref={val}
          onKeyDown={this.handleKeyDown}
          className={linkClass}
          style={linkStyle}
          onClick={handleClick}>
          {val}
        </a>
      );
    };

    var containerStyle = {
      position: 'relative',
      zIndex: 1,
    };
    var textareaStyle = {
    };
    var menuStyle = {
      display: this.state.matches.length ? '' : 'none',
      position: 'absolute',
      top: this.state.anchor.top + 20, // Seems magical – figure out better way to handle this
      left: this.state.anchor.left -16,
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '3px'
    };

    return (
      <div className="mb4" style={containerStyle}>
        <textarea
          {...this.props}
          className="form-control"
          style={textareaStyle}
          ref="textarea"
          value={this.state.value}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          />
        <div ref="menu"
          className="xlist-group"
          onKeyDown={this.handleKeyDown}
          style={menuStyle}>
          {this.state.matches.map(renderItems)}
        </div>
      </div>
    )
  }

});

