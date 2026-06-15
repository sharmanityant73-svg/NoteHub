async function generateSummary(noteId){

try{

const summaryBox = document.getElementById("summary-"+noteId)

summaryBox.innerHTML = "Generating AI summary..."

const res = await fetch('/notes/' + noteId + '/summarize',{
method:"POST"
})

const data = await res.json()

if(data.summary){

summaryBox.innerHTML = `
<strong>🤖 AI Summary:</strong>
<p>${data.summary}</p>
`

}else{

alert("AI failed: " + data.error)

}

}catch(err){

console.error(err)

alert("Something went wrong")

}

}