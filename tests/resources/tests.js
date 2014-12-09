function setupTests()
{
    setup({explicit_done:true});
}

/**
/ Tests hould be of the form testInput(<intention name>, <start markup>, <end markup>, <data>)
/ intention: the type of intention to run, for instance 'delete'
/ startMarkup: the markup to put in the test area. For intentions that require a selection, it must be given in this form: 
/ <ELEMENT startContainer=VALUE startOffset=VALUE> and <ELEMENT endContainer=VALUE endOffset=VALUE> where
/ ELEMENT is the element that should contain the start, end, or both
/ VALUE for startContainer and endContainer is 'me' or "child0" (if you want to use a child textnode instead of the element itself for the start of the range)
/ VALUE for startOffset and endOffset should be a number
**/
function runTests()
{
    clearTestDiv();
    done();
}

function testInput(intention, startMarkup, endMarkup, data)
{   
    switch (intention)
    {
        default:        
        break;
            
    }
}

function clearTestDiv()
{
    document.querySelector("#testdiv").innerHTML=""; 
}