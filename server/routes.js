var router = require('express').Router();
var Models = require('../cooklydatabase.js');
var path = require('path');

router.get('/api/getUserEvents', function(req, res) {
  Models.connection.query(
    `SELECT
      CONCAT(hs.firstName, ' ', hs.lastName) AS hostName,
      CONCAT(lc.address, ', ', lc.city, ', ', lc.state) AS address,
      ev.cuisine AS theme,
      ev.price,
      ev.startTime AS date,
      ub.UserId AS userId,
      ev.id AS eventId,
      ev.title AS eventTitle
    FROM
      Events AS ev
      JOIN Hosts AS hs ON hs.id = ev.HostId
      JOIN Locations AS lc ON lc.id = ev.LocationId
      JOIN UserBookings AS ub ON ub.EventId = ev.id
    WHERE
      ub.UserId = 1`,
    {type: Models.connection.QueryTypes.SELECT}
  ).then(function(data) {
    res.send(data);
  });
});

router.get('/api/getEvents', function(req, res) {
  Models.connection.query(
    `SELECT
      CONCAT(hs.firstName, ' ', hs.lastName) AS hostName,
      CONCAT(lc.address, ', ', lc.city, ', ', lc.state) AS address,
      ev.cuisine AS theme,
      ev.price,
      ev.startTime AS date,
      ev.id AS eventId,
      ev.title AS eventTitle
    FROM
      Events AS ev
      JOIN Hosts AS hs ON hs.id = ev.HostId
      JOIN Locations AS lc ON lc.id = ev.LocationId`,
    {type: Models.connection.QueryTypes.SELECT}
  ).then(function(data) {
    res.send(data);
  });
});

router.post('/api/userCancelBooking', function(req, res) {
  // console.log('INSIDE userCancelBooking Post Request in routes with data: ', req.body);
  var data = req.body;
  Models.UserBooking.destroy({
    where: {
      UserId: data.userId,
      EventId: data.eventId
    }
  })
  .then(function() {
    res.send();
  })
  .catch(err => console.log(err));
});

router.post('/api/userBookEvent', function(req, res) {
  var data = req.body;
  console.log('LINE 70 ------ : ', data);
  Models.UserBooking.build({
    UserId: 1,
    EventId: data.eventId
  })
  .save()
  .then(function() {
    res.send();
  })
  .catch(err => console.log(err));
});

router.get('/api/allUpcommingEvents', function(req, res) {
  Models.Event.findAll().then(function(data) {
    var list = data.map(item => item);
    res.send(list);
  });
});

router.get('/api/menus/:email', function(req, res) {
  Models.Host.findOne({ where: {email: req.params.email} }).then(function(Host) {
    
    Models.Menu.findAll({
      where: {
        HostId: Host.id
      }
    })
    .then(function(data) {
      res.send(data);
    })
    .catch(err => console.log(err));
  });
  
});

router.post('/api/menus/:email', function(req, res) {
  
  Models.Host.findOne({ where: {email: req.params.email} }).then(function(Host) {
    console.log(Host.id);
    Models.Menu.create({ HostId: Host.id, MenuItemDesc: JSON.stringify(req.body) })
    .then(function(task) {
      res.send();
    })
    .catch(err => console.log(err));
  });
  
});

router.post('/api/hosts', function(req, res) {
  Models.Host.findOne( {where: {email: req.body.email}})
  .then(function(Host) {
    if (!Host) {
      Models.Host.create( {firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email} )
      .then(function() {
        res.send();
      }); 
    }
  });

});

var doesEntryExist = function (model, column, value, callback) {
  var obj = {};
  obj[column] = value;
  model.findOne({'attributes': ['id'], where: obj})
  .then(function(model) {
    if (!model) {
      callback(false, undefined);
    } else {
      callback(true, model.dataValues.id);
    }
  });
};  

router.post('/api/postevent', function (req, res) {
  res.statusCode = 201;
  console.log(req.body);
  var startTime = req.body.startTime;
  startTime = Number(startTime);
  var endTime = req.body.endTime;
  endTime = Number(endTime);
  var day = req.body.day;
  day = Number(day);
  var month = req.body.month;
  month = Number(month);
  var cuisine = req.body.cuisine;
  var address = req.body.address;
  var city = req.body.city;
  var state = req.body.state;
  var maxseats = req.body.maxseats;
  maxseats = Number(maxseats);
  var title = req.body.title;
  var description = req.body.description;

  doesEntryExist(Models.Location, 'City', city, function (cityBool, id) {
    Models.Event.build({
      'cuisine': cuisine,
      'maxSeats': maxseats,
      'startTime': new Date(2017, month + 1, day, startTime),
      'endTime': new Date(2017, month + 1, day, endTime),
      'title': title,
      'description': description,
      'price': '9.99'
    }).save().then(function (event) {
      if (cityBool) {
        event.update({'LocationId': id});
      }
      if (!cityBool) {
        Models.Location.build({
          'city': city,
          'state': state,
          'address': address
        }).save().then(function (location) {
          event.update({'LocationId': location.get('id')});
        });
      }
      res.send({'eventStatus': 'created'});
    });
  });
});

router.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

module.exports = router;
