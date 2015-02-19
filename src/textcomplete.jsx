
// WIP - Do not use this (yet)

// To do:
// - regex match
// - multiple strategies
// - handle return characters
// - handle key events
// - positioning based on cursor
// - prop for max number of matches to show in menu list

var React = require('react');
var fuzzy = require('fuzzy');

module.exports = React.createClass({

  getInitialState: function() {
    return {
      value: this.props.value,
      words: [],
      currentWord: 0,
      cursorPosition: 0,
      matches: [],
      selectedMatch: -1,
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
    var words = string.split(/[\n\r\s]+/);
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
    this.getMenuPosition();
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

  getMenuPosition: function() {
    var $dummy = this.refs.dummy.getDOMNode();
    var dummyHTML = '';
    this.state.words.forEach(function(word) {
      dummyHTML += '<span>' + word.value + '</span> ';
    });
    $dummy.innerHTML = dummyHTML;
    var $dummySpans = $dummy.querySelectorAll('span');
    console.log($dummySpans, $dummySpans.item(this.state.currentWord));
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

  componentDidMount: function() {
    //if (!document) return false;
    //document.onKeydown = this.handleKeyDown;
    this.getMenuPosition();
  },

  render: function() {
    var self = this;
    var renderItems = function(val, i) {
      var key = 'match-' + i;
      var handleClick = function(e) {
        self.completeWord(e.target.innerText);
      };
      var linkClass = 'list-group-item ';
      if (self.state.selectedMatch == i) {
        linkClass += 'active';
      }
      return (
        <a href="#!"
          key={key}
          ref={val}
          onKeyDown={this.handleKeyDown}
          className={linkClass}
          onClick={handleClick}>
          {val}
        </a>
      );
    };

    var containerStyle = {
      //position: 'relative',
    };
    var textareaStyle = {
    };
    var listStyle = {
      display: this.state.matches.length ? '' : 'none'
    };

    var dummyValue = this.state.value;
    // Copy textarea style and className
    var dummyStyle = {
      color: 'white',
      backgroundColor: 'tomato',
      opacity: .5,
      position: 'absolute',
      bottom: 0
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
        <textarea
          ref="dummy"
          className="form-control"
          style={dummyStyle}
          readOnly />
        <div ref="menu"
          className="list-group"
          onKeyDown={this.handleKeyDown}
          style={listStyle}>
          {this.state.matches.map(renderItems)}
        </div>
      </div>
    )
  }

});

