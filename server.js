const express = require("express");
const app = express();
const request = require('request');
var cors = require('cors')
var rp = require('request-promise');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");

const User = require('./models/User');
const Project = require('./models/Project');
const Epic = require('./models/Epic');
const Team = require('./models/Team');
const Story = require('./models/Story');

const uri = "mongodb://projerUser:projer@cluster0-shard-00-00-llorh.gcp.mongodb.net:27017,cluster0-shard-00-01-llorh.gcp.mongodb.net:27017,cluster0-shard-00-02-llorh.gcp.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";
const PORT = process.env.PORT || 5000;

app.use(cors())

app.use(bodyParser.json());

app.use('/user', require('./api/users'));
app.use('/project', require('./api/projects'));
app.use('/epic', require('./api/epics'));
app.use('/story', require('./api/stories'));
app.use('/team', require('./api/teams'));

app.get("/healthCheck", async (req, res, next) => {
    res.status(200).send({ masseage: "Hello world" });
});


app.post("/jira/getStories", async (req, res, next) =>  {

    let options = {rejectUnauthorized: false,
        uri: "",
        method: 'GET',
        auth: {'user': '',
        'pass': ''}
    };

    const { email , password, project } = req.body;



    try{    
        const user = await User.findOne({ email });
 
        if(user && user.password === password){

            try{
                
                const project_doc = await Project.findOne({user_id: user._id, project_key: project})

                options.auth = {'user': email, 'pass': password}
                options.uri = "https://mehran-development.atlassian.net/rest/api/2/search?jql=project%3D%22"+project+"%22%20AND%20issuetype%3D%22Story%22&"+`fields=key,resolutiondate,${project_doc.team_field},${project_doc.storyPoint_field},${project_doc.parentEpic_field}`;
                let result = await rp(options);
                result = JSON.parse(result);
                result = result["issues"];
                res.status(200).send(result)
            }catch(e){
                next(e)
            }
        }else{
            next(new Error("Unauthorized"));
        }
    }catch(e){
        next(e)
    }

});

mongoose.connect(uri, () => console.log(`DB connected at ${uri}`));

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`)
  })
