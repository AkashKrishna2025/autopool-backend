const db = require("../models");
const { getPaginate } = require("../lib/helpers");
const State = db.State;
const City = db.City

exports.list = async (req, res) => {
  await State.find({ status: 'active' }).skip((pageLimit * pageNumber) - pageLimit)
    .sort({ createdAt: 'desc' })
    .limit(pageLimit)
    .exec().then(async (data) => {
      const count = await State.countDocuments({ status: 'active' }).exec();
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
  if (!req.body.name) {
    res.status(400).json({
      is_error: true,
      message: "Please Enter State Name",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }
  const state = new State({
    name: req.body.name
  });

  state.save(state).then(data => {
    res.send(data);
  }).catch(err => {
    res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: err.message
    });
  });
};


exports.detail = async (req, res) => {
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select State",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  await State.findOne({ _id: req.params.id }).then(async (data) => {
    return res.json({ is_error: false, message: 'State found', data });
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
      message: "Please Select State",
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
  await State.findByIdAndUpdate(id, req.body, { new: true }).then(async (data) => {
    await City.updateMany({state_id: id},{ $set: {state_name: req.body.name} } )
    
    if (!data) {
      res.status(404).send({
        is_error: true,
        message: `Cannot update state with id=${id}. Maybe state was not found!`
      });
    } else res.send({ is_error: false, message: 'State data updated successfully.', data });
  }).catch(err => {
    res.status(422).send({
      is_error: true,
      message: "Error updating State with id=" + id,
      error_message: err.message
    });
  });
};

exports.delete = (req, res) => {
  //console.log("req.query => ", req.params.id)
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select State",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  State.findOneAndUpdate({ _id: req.params.id }, { status: 'deleted' }, { new: true }).then(async (data) => {
    await City.updateMany({state_id: req.params.id},{ $set: {status: 'deleted'} } )
    return res.json({ is_error: false, message: 'State deleted' });
  }).catch(err => {
    res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: err.message
    });
  });
};