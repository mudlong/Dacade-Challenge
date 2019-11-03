
  
const contractSource = `
contract Projectify =

  record project = {
    id:int,
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
    let newProject = {id=getProjectLength() + 1, name=_name, price=_price, documentation = _documentation, link = _link, images=_images,purchased=false, owner=Call.caller, timestamp = Chain.timestamp}
    let index = getProjectLength() + 1
    put(state{projects[index] = newProject , projectLength  = index})

  
  entrypoint get_project_by_index(index:int) : project = 
    switch(Map.lookup(index, state.projects))
      None => abort("Project does not exist with this index")
      Some(x) => x  
  
  payable stateful entrypoint buyProject(_id:int)=
    let buy_project = get_project_by_index(_id) // get the current Project with the id
    
    let  _seller  = buy_project.owner : address
    
    require(buy_project.id > 0,abort("NOT A Project ID"))
    
    // require that there is enough AE in the transaction
    require(Call.value >= buy_project.price,abort("You Don't Have Enough AE"))
    
    // require that the Project has not been purchased
    
    require(!buy_project.purchased,abort("PROJECT ALREADY PURCHASED"))
    
    // require that the buyer is not the seller
    
    require(_seller != Call.caller,"SELLER CAN'T PURCHASE HIS ITEM")
    
    // transfer ownership
    
    //buy_project.owner = Call.caller
    
    // mark as  purchased
    
    //buy_project.purchased = true 
    
    // update the Project
    let updated_project = {id=buy_project.id, name=buy_project.name, price=buy_project.price, images=buy_project.images, documentation = buy_project.documentation, link = buy_project.link, purchased = true, owner=Call.caller, timestamp = buy_project.timestamp}
    
    put(state{projects[_id] = updated_project})
    
    // sends the amount
    
    Chain.spend(_seller, Call.value)
  
    `;


const contractAddress = 'ct_7UDAct1WNutBfm8A9Eqf644jSAZF6ecZ3M6dALWwHLwfbxb1R';
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
  console.log("for loop reached")
}
//Create a asynchronous read call for our smart contract
async function callStatic(func, args) {
  //Create a new contract instance that we can interact with
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to get data of smart contract func, with specefied arguments
  console.log("Contract : ", contract)
  const calledGet = await contract.call(func, args, {
    callStatic: true
  }).catch(e => console.error(e));
  //Make another call to decode the data received in first call
  console.log("Called get found: ", calledGet)
  const decodedGet = await calledGet.decode().catch(e => console.error(e));
  console.log("catching errors : ", decodedGet)
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
  $("#loading-bar-spinner").show();

  client = await Ae.Aepp()

  ProjectLength = await callStatic('getProjectLength', []);


  for (let i = 1; i <= ProjectLength; i++) {
    const persons = await callStatic('get_project_by_index', [i]);

    console.log("for loop reached", "pushing to array")

    console.log(persons.name)
    console.log(persons.documentation)
    console.log(persons.images)


    ProjectArray.push({
      id: persons.id,
      images: persons.images,

      name: persons.name,
      documentation: persons.documentation,
      price: persons.price,
      link : persons.link,
      timestamp : new Date(persons.timestamp)
    })

    // vote
    //   $(function () {
    //     $("i").click(function () {
    //       $("i,span").toggleClass("press", 1000);
    //     });
    //   });
    // }
    renderProject();
    $("#loading-bar-spinner").hide();
  }
});




// $("#body").on("click", ".voteBtn", async function (event) {
//   $("#loading-bar-spinner").show();
//   console.log("Just Clicked The vote Button")



//   // const dataIndex = event.target.id
//   dataIndex = ProjectArray.length


//   await contractCall('vote', [dataIndex], 0)


  
//   // $("#votes").load(window.location.href + " #votes");
//   location.reload(true)
  
  

  


//   renderProject();
//   $("#loading-bar-spinner").hide();
// });

$('#regBtn').click(async function(){
  $("#loading-bar-spinner").show();
  console.log("Button Clicked")
  const Project_name = ($('#Username').val());
  const Project_images = ($("#imagelink").val());
  const Project_description = ($("#projectdescription").val());
  const Project_price = ($('#price').val());
  const Project_link = ($('#projectlink').val());
  console.log("-------------------------------------")
  console.log("Name:",Project_name)
  console.log("images:",Project_images)
  console.log("pric:",Project_price)
  console.log("link:",Project_link)

  const new_Project = await contractCall('addProject', [Project_name, Project_price, Project_images,Project_description, Project_link],parseInt(Project_price, 10));
  console.log("SAVED TO THE DB", new_Project)

  ProjectArray.push({
    id: new_Project.id,
    images: new_Project.images,

    name: new_Project.name,
    description: new_Project.description,
    link: new_Project.link,
    price : new_Project.price
  })


  renderProject();
  
    //This will clear the value in all scenarious
    var name_input = document.getElementById("Username")
        name_input.value =""
    var image_input = document.getElementById("imagelink")
        url_input.value =""
    var image_input = document.getElementById("projectdescription")
       image_input.value = ""
    var image_input = document.getElementById("price")
       image_input.value = ""
    var image_input = document.getElementById("projectlink")
       image_input.value = ""
  // e.preventDefault();

  $("#loading-bar-spinner").hide();
  location.reload(true)

});
