const db = require("../models");
const { getPaginate } = require("../lib/helpers");
const City = db.City
const State = db.State;

exports.list = async (req, res) => {
  var condition = {status: 'active'};
  if(req.query.state) {
    condition.state_name = req.query.state;
  }

  if(req.query.state_id) {
    condition.state_id = req.query.state_id;
  }
  City.find(condition).skip((pageLimit * pageNumber) - pageLimit)
    .sort({ createdAt: 'desc' })
    .limit(pageLimit)
    .exec().then(async (data) => {
      const count = await City.countDocuments(condition).exec();
      res.json(getPaginate(data, count, pageNumber, pageLimit));
    }).catch(err => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message
      });
    });
};

exports.create = async (req, res) => {
  if (!req.body.name && !req.body.state_id) {
    res.status(400).json({
      is_error: true,
      message: "Please Enter City Name and select state",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  await State.findOne({ _id: req.body.state_id }).then(async (result) => {
    if(result) {
      console.log("result ================", result)
      const city = new City({
        name: req.body.name,
        state_id: req.body.state_id,
        state_name: result.name,
      });

      city.save(city).then(data => {
        res.send(data);
      }).catch((err) => {
        res.status(422).json({
          is_error: true,
          message: "Please Try again later.",
          error_message: err.message
        });
      });
    } else {
      res.status(422).json({
        is_error: true,
        message: "State not found",
        error_message: err.message
      });
    }
  }).catch((error) => {
    res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: error.message
    });
  });
};


exports.detail = async (req, res) => {
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select city",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  City.findOne({ _id: req.params.id }).then(async (data) => {
    return res.json({ is_error: false, message: 'City found', data });
  }).catch(err => {
    res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: err.message
    });
  });
};


exports.update = async (req, res) => {
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select City",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can't not be empty!"
    });
  }
  const id = req.params.id;
  City.findByIdAndUpdate(id, req.body, { new: true }).then(async (data) => {

    if (!data) {
      res.status(404).send({
        is_error: true,
        message: `Cannot update city with id=${id}. Maybe city was not found!`
      });
    } else res.send({ is_error: false, message: 'City data updated successfully.', data });
  }).catch(err => {
    res.status(422).send({
      is_error: true,
      message: "Error updating City with id=" + id,
      error_message: err.message
    });
  });
};

exports.delete = (req, res) => {
  //console.log("req.query => ", req.params.id)
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select City",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  City.findOneAndUpdate({ _id: req.params.id }, { status: 'deleted' }, { new: true }).then(async (data) => {
    return res.json({ is_error: false, message: 'City deleted' });
  }).catch(err => {
    res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: err.message
    });
  });
};