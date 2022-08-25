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
  matcher: function(prop) {
    // You can be more specific here if you only want 'em' units for font sizes    
    return ["spacing", "borderRadius", "borderWidth", "sizing"].includes(prop.attributes.category);
  },
  transformer: function(prop) {
    // You can also modify the value here if you want to convert pixels to ems
    return parseFloat(prop.original.value) + 'px';
  }
});

StyleDictionaryPackage.registerTransform({
  name: 'sizes/pxToRem',
  type: 'value',
  matcher: function(prop) {
    console.log(prop);
    return ["fontSize", "lineHeight", "letterSpacing"].includes(prop.attributes.category);
  },
  transformer: function(prop) {
      return parseFloat(prop.original.value / 16) + 'rem';
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
        "transforms": ["attribute/cti", "name/cti/kebab", "sizes/px", "color/css", "sizes/pxToRem"],
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

['global', 'common_test'].map(function (theme) {

    console.log('\n==============================================');
    console.log(`\nProcessing: [${theme}]`);

    const StyleDictionary = StyleDictionaryPackage.extend(getStyleDictionaryConfig(theme));

    StyleDictionary.buildPlatform('web');

    console.log('\nEnd processing');
})

console.log('\n==============================================');
console.log('\nBuild completed!');
