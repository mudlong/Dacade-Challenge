
  
const contractSource = `
contract Projectify =

  record project = {
    user:int,
    name: string,
    price:int,
    purchased:bool,
    documentation : string,
    link : string,
    images:string,
    owner:address,
    timestamp: int
    
    }
  
  
  record state = 
    {
      projectLength : int,
      projects : map(int, project)
    }
  
  entrypoint init() = 
    { projects = {}, 
      projectLength = 0}
  
    
  entrypoint getProjectLength() : int = 
    state.projectLength
  
  payable stateful entrypoint addProject(_name:string, _price:int, _images:string, _documentation : string, _link : string ) =
    let newProject = {user=getProjectLength() + 1, name=_name, price=_price, documentation = _documentation, link = _link, images=_images,purchased=false, owner=Call.caller, timestamp = Chain.timestamp}
    let index = getProjectLength() + 1
    put(state{projects[index] = newProject , projectLength  = index})

  
  entrypoint getProject(index:int) : project = 
    switch(Map.lookup(index, state.projects))
      None => abort("Project does not exist with this index")
      Some(x) => x  
  
  payable stateful entrypoint tipProject(_user:int, tip:int)=
    let tipProject = getProject(_user) // get the current Project with the user
    
    let  _seller  = tipProject.owner : address
    
    require(tipProject.user> 0,abort("NOT A Project user"))
  
    Chain.spend(_seller, tip)
    
    "Thank you for the tip"
  
    `;


const contractAddress = 'ct_spc6oNbPRdV7nXd7tt5vbZJq23KovaaQL5xZ9sV5Sfc6fPjZa';
var ProjectArray = [];
var client = null;
var ProjectLength = 0;



function renderProject() {
  ProjectArray = ProjectArray.sort(function (a, b) {
    return b.Price - a.Price
  })
  var template = $('#template').html();

  Mustache.parse(template);
  var rendered = Mustache.render(template, {
    ProjectArray
  });




  $('#body').html(rendered);
  console.log("rendering")
}
//Create a asynchronous read call for our smart contract
async function callStatic(func, args) {
  //Create a new contract instance that we can interact with
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to get data of smart contract func, with specefied arguments

  const calledGet = await contract.call(func, args, {
    callStatic: true
  }).catch(e => console.error(e));
 
  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {
    amount: value
  }).catch(e => console.error(e));

  return calledSet;
}

window.addEventListener('load', async () => {
  $("loading").show();

  client = await Ae.Aepp()

  ProjectLength = await callStatic('getProjectLength', []);


  for (let i = 1; i <= ProjectLength; i++) {
    const persons = await callStatic('getProject', [i]);

    console.log( "pushing to array")


    ProjectArray.push({
      id: persons.user,
      images: persons.images,

      name: persons.name,
      documentation: persons.documentation,
      price: persons.price,
      link : persons.link,
      timestamp : new Date(persons.timestamp)
    })
    
    renderProject();
    $("#loading").hide();
  }
});





$('#regBtn').click(async function(){
  $("#loading").show();
  console.log("Register buttonw was clicked")
  const Project_name = ($('#Username').val());
  const Project_images = ($("#imagelink").val());
  const Project_description = ($("#projectdescription").val());
  const Project_price = ($('#price').val());
  const Project_link = ($('#projectlink').val());


  const newProject = await contractCall('addProject', [Project_name, Project_price, Project_images,Project_description, Project_link],parseInt(Project_price, 10));
  

  ProjectArray.push({
    id: newProject.user,
    images: newProject.images,

    name: newProject.name,
    description: newProject.description,
    link: newProject.link,
    price : newProject.price
  })


  renderProject();
 

  $("#loading").hide();
  location.reload(true)

});

$('#body').on('click', '#tipbutton', async function(event){
  $("#loading").show();

  dataIndex = ProjectArray.length

  const tipValue = ($('#tipValue').val());
  console.log(tipValue)

  

  


  await contractCall('tipProject', [dataIndex, tipValue], tipValue)

  console.log("Tipped successfully")

  $('#tipValue').val('');


  $("#loading").hide();

});
