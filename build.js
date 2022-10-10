const StyleDictionaryPackage = require('style-dictionary');

// HAVE THE STYLE DICTIONARY CONFIG DYNAMICALLY GENERATED

StyleDictionaryPackage.registerFormat({
  name: 'css/variables',
  formatter: function (dictionary, config) {
    return `${this.selector} {
      ${dictionary.allProperties.map(prop => `  --${prop.name}: ${prop.value};`).join('\n')}
    }`
  }
});

StyleDictionaryPackage.registerFormat({
  name: 'scss/fontsMixin',
  formatter: function (dictionary, config) {
    const propsMapper = {
      fontFamily: "font-family",
      fontWeight: "font-weight",
      lineHeight: "line-height",
      fontSize: "font-size",
      letterSpacing: "letter-spacing",
      textCase: "text-transform",
      textDecoration: "text-decoration"
    };

    let mixins = '';

    dictionary.allProperties.map (function (prop) {
      console.log(prop);
      mixins += `@mixin ${prop.name} {` + '\n';
      Object.keys(propsMapper).forEach(key => {
        if (key in prop.value) {
          mixins += `  ${propsMapper[key]}: ${prop.value[key]};` + '\n';
        }
      });
      mixins += '}\n\n'; 
    });

    return mixins;
  }
});

StyleDictionaryPackage.registerFormat({
  name: 'css/transition',
  formatter: function (dictionary, config) {
    let transitionItems = [];
    let transitionTokens = [];
    
    dictionary.allProperties.forEach(token => {
      if (!transitionItems.includes(token.attributes.item) && token.attributes.type == 'transition') {
        transitionItems.push(token.attributes.item);
        transitionTokens.push(token);
      }
    });

    let transitionFunc = '';
    let transitionDuration = '';
    let transitionName = '';
    let transitions = '';

    transitionItems.forEach(item => {
      transitionTokens.forEach(token => {
        if (token.attributes.item == item && token.attributes.type == 'transition') {
          if (token.attributes.state == 'function') {
            transitionFunc = token.value;
          }
          if (token.attributes.state == 'duration') {
            transitionDuration = token.value + 'ms';
          }
          transitionName = `${token.attributes.category}-${token.attributes.tier}-${token.attributes.device}-${token.attributes.type}-${token.attributes.item}-${token.attributes.subitem}`;
        }
      })
      transitions += `--${transitionName}: cubic-bezier(${transitionFunc}) ${transitionDuration};` + '\n';
    });

    return `${this.selector} { 
      ${transitions}
    }`;
  }
});

StyleDictionaryPackage.registerTransform({
  name: 'sizes/px',
  type: 'value',
  matcher: function(token) {
    // You can be more specific here if you only want 'em' units for font sizes
    return ["spacing", "borderRadius", "borderWidth", "sizing"].includes(token.attributes.category);
  },
  transformer: function(token) {
    // You can also modify the value here if you want to convert pixels to ems
    return parseFloat(token.original.value) + 'px';
  }
});

StyleDictionaryPackage.registerTransform({
  name: 'attribute/extendedCti',
  type: 'attribute',
  transformer: function(token) {
    // Token format: category.tier.device.type.item.subitem.state
    const attrNames = ['category', 'tier', 'device', 'type', 'item', 'subitem', 'state'];
    const originalAttrs = token.attributes || {};
    const generatedAttrs =  {};

    for(let i=0; i<token.path.length && i<attrNames.length; i++) {
      generatedAttrs[attrNames[i]] = token.path[i];
    }
    
    return Object.assign(generatedAttrs, originalAttrs);
  }
});

StyleDictionaryPackage.registerTransform({
  name: 'sizes/fonts',
  type: 'value',
  matcher: function(token) {
    return ["typography"].includes(token.type);
  },
  transformer: function(token) {
    ["fontSize", "lineHeight", "letterSpacing"].forEach(function(element) {
      if (element in token.original.value) {
        token.original.value[element] = parseFloat(token.original.value[element] / 16) + 'rem';
      }
    });

    ["fontFamily"].forEach(function(element) {
      if (element in token.original.value) {
        token.original.value[element] = `"${token.original.value[element]}", sans-serif`;
      }
    });

    ["fontWeight"].forEach(function(element) {
      if (element in token.original.value) {
        token.original.value[element] = token.original.value[element].toString().toLowerCase();
      }
    });

    return token.original.value
  }
});

StyleDictionaryPackage.registerTransform({
  name: 'sizes/rem',
  type: 'value',
  matcher: function(token) {
    // You can be more specific here if you only want 'em' units for font sizes
    return ["spacing", "borderRadius", "borderWidth", "sizing"].includes(token.attributes.category);
  },
  transformer: function(token) {
    // You can also modify the value here if you want to convert pixels to ems
    return parseFloat(token.original.value / 16) + 'rem';
  }
});

StyleDictionaryPackage.registerTransform({
  name: 'shadows/dropShadowCss',
  type: 'value',
  matcher: function(token) {
    return ["dropShadow"].includes(token.attributes.type);
  },
  transformer: function(token) {
      // Split hex8 to four channels array
      let hex8Split =  token.original.value.color.substring(1).match(/.{2}/g);
      //Check if it's right hex8
      if(hex8Split.length != 4) { throw new Error('Bad Hex in boxShadow ' + token.name); }

      // Parse hex channel value to decimal
      const rgb = function(hex) {
        return parseInt(hex, 16);
      };

      // Parse hex channel to alpha (with 2 decimals)
      const alpha = function(hex) {
        return parseFloat(parseInt((parseInt(hex, 16)/255)*100)/100);
      };
      
      // Convert four channels array to alpha, pop alpha from array and convert rgb values
      let rgbValues = [];
      let alphaValue = alpha(hex8Split[3]);
      hex8Split.pop();
      hex8Split.forEach(function(item){
        rgbValues.push(rgb(item));
      })
      
      // Return CSS-compatible drop shadow value
      return parseFloat(token.original.value.x) + 'px ' + parseFloat(token.original.value.y) + 'px ' 
        + parseFloat(token.original.value.blur) + 'px ' + parseFloat(token.original.value.spread) + 'px rgba(' + rgbValues.join(', ') + ', ' + alphaValue + ')';
  }
});

StyleDictionaryPackage.registerTransform({
  name: 'motion/css',
  type: 'value',
  matcher: function(token) {
    return ["transition"].includes(token.attributes.type);
  },
  transformer: function(token) {
    console.log(token);

    return 'cubic-bezier: (' + token.value.cubicBezier.value + ') ' + token.value.duration.value + 'ms';
  }
});

function getStyleDictionaryConfig(tokensSet) {
  console.log(`\config: [${tokensSet}]`);
  return {
    "source": [
      `tokens/${tokensSet}.json`,
    ],
    "platforms": {
      "web": {
        "transforms": ["attribute/extendedCti", "name/cti/kebab", "sizes/px", "color/css", "sizes/fonts", "shadows/dropShadowCss", "motion/css"],
        "buildPath": `output/`,
        "files": [{
            "destination": `${tokensSet}.css`,
            "format": "css/variables",
            "selector": `.${tokensSet}`
          }]
      },
      "scss/fonts": {
        "transforms": ["attribute/extendedCti", "name/cti/kebab", "sizes/fonts"],
        "buildPath": `output/`,
        "files": [{
            "destination": `${tokensSet}.scss`,
            "format": "scss/fontsMixin",
            "selector": `.${tokensSet}`
          }]
      },
      "css/transitions": {
        "transforms": ["attribute/extendedCti", "name/cti/kebab"],
        "buildPath": `output/`,
        "files": [{
            "destination": `${tokensSet}.transition.css`,
            "format": "css/transition",
            "selector": `.${tokensSet}`
          }]
      }
    }
  };
}

console.log('Build started...');

// PROCESS THE DESIGN TOKENS FOR THE DIFFEREN BRANDS AND PLATFORMS

['visual_common', 'visual_theme_light', 'visual_theme_dark'].map(function (tokensSet) {

    console.log('\n==============================================');
    console.log(`\nProcessing: [${tokensSet}]`);

    const styleDictionary = StyleDictionaryPackage.extend(getStyleDictionaryConfig(tokensSet));
    
    //styleDictionary.buildPlatform('web');
    styleDictionary.buildPlatform('css/transitions');

    console.log('\nEnd processing');
});

['font', 'font_tv'].map(function (tokensSet) {

  console.log('\n==============================================');
  console.log(`\nProcessing: [${tokensSet}]`);

  const styleDictionary = StyleDictionaryPackage.extend(getStyleDictionaryConfig(tokensSet));
  
  //styleDictionary.buildPlatform('scss/fonts');

  console.log('\nEnd processing');
})


console.log('\n==============================================');
console.log('\nBuild completed!');
