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
    const generatedAttrs =  {}

    for(let i=0; i<token.path.length && i<attrNames.length; i++) {
      generatedAttrs[attrNames[i]] = token.path[i];
    }
    
    return Object.assign(generatedAttrs, originalAttrs);
  }
});

StyleDictionaryPackage.registerTransform({
  name: 'sizes/pxToRem',
  type: 'value',
  matcher: function(token) {
    return ["fontSize", "lineHeight", "letterSpacing"].includes(token.attributes.type);
  },
  transformer: function(token) {
      return parseFloat(token.original.value / 16) + 'rem';
  }
});

StyleDictionaryPackage.registerTransform({
  name: 'shadows/dropShadowCss',
  type: 'value',
  matcher: function(token) {
    return ["dropShadow"].includes(token.attributes.tier);
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
        rgbValues.push(rgb(item))
      })
      
      // Return CSS-compatible drop shadow value
      return parseFloat(token.original.value.x) + 'px ' + parseFloat(token.original.value.y) + 'px ' 
        + parseFloat(token.original.value.blur) + 'px ' + parseFloat(token.original.value.spread) + 'px rgba(' + rgbValues.join(', ') + ', ' + alphaValue + ')';
  }
});

// StyleDictionaryPackage.registerTransform({
//   name: 'shadows/transitionCss',
//   type: 'value',
//   matcher: function(token) {
//     return ["dropShadow"].includes(token.attributes.type);
//   },
//   transformer: function(token) {
      
//       return true;
//   }
// });

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

function getStyleDictionaryConfig(theme) {
  console.log(`\config: [${theme}]`);
  return {
    "source": [
      `tokens/${theme}.json`,
    ],
    "platforms": {
      "web": {
        "transforms": ["attribute/extendedCti", "name/cti/kebab", "sizes/px", "color/css", "sizes/pxToRem", "shadows/dropShadowCss", "motion/css"],
        "buildPath": `output/`,
        "files": [{
            "destination": `${theme}.css`,
            "format": "css/variables",
            "selector": `.${theme}`
          }]
      }
    }
  };
}

console.log('Build started...');

// PROCESS THE DESIGN TOKENS FOR THE DIFFEREN BRANDS AND PLATFORMS

['global', 'common_measures'].map(function (theme) {

    console.log('\n==============================================');
    console.log(`\nProcessing: [${theme}]`);

    const StyleDictionary = StyleDictionaryPackage.extend(getStyleDictionaryConfig(theme));

    StyleDictionary.buildPlatform('web');

    console.log('\nEnd processing');
})

console.log('\n==============================================');
console.log('\nBuild completed!');
