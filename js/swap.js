// VARIABLES

var pairs = [
  ["digital ecosystem", "incubator"],
  ["digital pitch book", "demo day"],
  ["data tool", "startup programme"],
  ["summary", "pitch competition"],
  ["mentoring tool", "programme"],
  ["showcase", "programme alumni"],
  ["lookbook", "founders/startups"],
  ["collaboration tool", "founders"],
  ["summary", "stakeholders"],
  ["community tool", "alumni"],
  ["digital directory", "accelerator"],
];

var count = 0;

// the elements containing the words
var word1 = document.getElementById("swap-word-1");
var word2 = document.getElementById("swap-word-2");

var wordSwapInterval = setInterval(function(){
  // swap out the words
  swapWords();
  
  // either increase the count or reset it to 0
  if (count === pairs.length - 1) {
    count = 0;
  } else {
    count++;
  }
  
}, 3000);


// FUNCTIONS

function swapWords() {
  
  // fade out the old words
  word1.classList.add("transparent");
  word2.classList.add("transparent");
  
  // grab the next set of words from the array
  var selection1 = pairs[count][0];
  var selection2 = pairs[count][1];
  
  // delay the fade-in for a bit
  var fadeDelay = setTimeout(function() {
    
    // swap the text
    word1.textContent = selection1;
    word2.textContent = selection2;
    
    // fade the words back in
    word1.classList.remove("transparent");
    word2.classList.remove("transparent");
    
  }, 1000);
}
