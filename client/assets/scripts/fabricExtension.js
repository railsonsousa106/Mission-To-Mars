var _wrapLine = function (_line, lineIndex, desiredWidth, reservedSpace) {
  var lineWidth = 0,
    splitByGrapheme = this.splitByGrapheme,
    graphemeLines = [],
    line = [],
    // spaces in different languges?
    words = splitByGrapheme
      ? fabric.util.string.graphemeSplit(_line)
      : _line.split(this._wordJoiners),
    word = "",
    offset = 0,
    infix = splitByGrapheme ? "" : " ",
    wordWidth = 0,
    infixWidth = 0,
    largestWordWidth = 0,
    lineJustStarted = true,
    additionalSpace = splitByGrapheme ? 0 : this._getWidthOfCharSpacing();

  reservedSpace = reservedSpace || 0;
  desiredWidth -= reservedSpace;
  for (var i = 0; i < words.length; i++) {
    // i would avoid resplitting the graphemes
    word = fabric.util.string.graphemeSplit(words[i]);
    wordWidth = this._measureWord(word, lineIndex, offset);
    offset += word.length;

    // Break the line if a word is wider than the set width
    if (this.breakWords && wordWidth >= desiredWidth) {
      if (!lineJustStarted) {
        line.push(infix);
        lineJustStarted = true;
      }

      // Loop through each character in word
      for (var w = 0; w < word.length; w++) {
        var letter = word[w];
        var letterWidth =
          (this.getMeasuringContext().measureText(letter).width *
            this.fontSize) /
          this.CACHE_FONT_SIZE;
        if (lineWidth + letterWidth > desiredWidth) {
          graphemeLines.push(line);
          line = [];
          lineWidth = 0;
        } else {
          line.push(letter);
          lineWidth += letterWidth;
        }
      }
      word = [];
    } else {
      lineWidth += infixWidth + wordWidth - additionalSpace;
    }

    if (lineWidth >= desiredWidth && !lineJustStarted) {
      graphemeLines.push(line);
      line = [];
      lineWidth = wordWidth;
      lineJustStarted = true;
    } else {
      lineWidth += additionalSpace;
    }

    if (!lineJustStarted) {
      line.push(infix);
    }
    line = line.concat(word);

    infixWidth = this._measureWord([infix], lineIndex, offset);
    offset++;
    lineJustStarted = false;
    // keep track of largest word
    if (wordWidth > largestWordWidth && !this.breakWords) {
      largestWordWidth = wordWidth;
    }
  }

  i && graphemeLines.push(line);

  if (largestWordWidth + reservedSpace > this.dynamicMinWidth) {
    this.dynamicMinWidth = largestWordWidth - additionalSpace + reservedSpace;
  }

  return graphemeLines;
};

const originalRender = fabric.Object.prototype.render;
const newRender = function (ctx) {
  if (
    (!this.group && !this.isOnScreen(true)) ||
    (this.group && !this.group.isOnScreen(true) && !this.editing)
  ) {
    return;
  }
  originalRender.call(this, ctx);
};

fabric.util.object.extend(fabric.Textbox.prototype, {
  _wrapLine: _wrapLine,
});

fabric.util.object.extend(fabric.Object.prototype, {
  render: newRender,
});
