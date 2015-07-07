GithubApi = require('github');
yaml = require('js-yaml');
fs = require('fs');
async = require('async');

var repos_db = yaml.safeLoad(fs.readFileSync('./repos.yml', 'utf8'));
console.log('Repositories loaded:', repos_db.repos.length);

var gh = new GithubApi({
  version: '3.0.0'
});

async.mapLimit(repos_db.repos, 3, function(item, callback){
  var user = item.id.split('/')[0];
  var repo = item.id.split('/')[1];

  console.log('Loading Repo:', item.id);
  gh.repos.get({user: user, repo: repo}, function(err, data){
    if (! err) {
      console.log('Loaded:', item.id);

      delete item.id;
      item.name = data.name;

      item.owner = {};
      item.owner.login = data.owner.login;
      item.owner.url = data.owner.html_url;
      item.owner.avatar_url = data.owner.avatar_url;

      item.stars = data.stargazers_count;
      item.url = data.html_url;
      item.last_update = data.updated_at;
      item.language = data.language;
      item.tags = (item.tags || []).map(function(t){
        return t.toLowerCase();
      });

      item.desc = item.desc || data.description;

      callback(null, item);
    } else {
      console.log('Error loading:', item.id, err);
      callback(err);
    }
  });
}, function(err, results){
  if (! err) {
    var date = new Date();
    var output = {
      'updated': date,
      'repos': results
    };
    var generated_json = JSON.stringify(output);
    fs.writeFile('./generated.json', generated_json);
  } else {
    process.exit(1);
  }
});
//gh.repos.get()
