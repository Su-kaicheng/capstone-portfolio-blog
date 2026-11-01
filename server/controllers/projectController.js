const Project = require('../models/Project');
const httpError = require('../utils/httpError');
const { projectInput, projectUpdateInput } = require('../utils/validators');

const AUTHOR_FIELDS = 'username';

/** GET /api/projects — public list, newest first, owner username populated. */
exports.list = async (req, res) => {
  const projects = await Project.find()
    .sort({ createdAt: -1, _id: -1 })
    .populate('user', AUTHOR_FIELDS);
  res.json(projects);
};

/** GET /api/projects/:id — public detail. */
exports.detail = async (req, res) => {
  const project = await Project.findById(req.params.id).populate('user', AUTHOR_FIELDS);
  if (!project) throw httpError(404, 'Project not found');
  res.json(project);
};

/** POST /api/projects — admin only; owner is taken from the JWT, never the body. */
exports.create = async (req, res) => {
  const project = await Project.create({ ...projectInput(req.body), user: req.user._id });
  await project.populate('user', AUTHOR_FIELDS);
  res.status(201).json(project);
};

/** PUT /api/projects/:id — admin only; partial updates allowed. */
exports.update = async (req, res) => {
  const update = projectUpdateInput(req.body);
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { returnDocument: 'after', runValidators: true }
  ).populate('user', AUTHOR_FIELDS);
  if (!project) throw httpError(404, 'Project not found');
  res.json(project);
};

/** DELETE /api/projects/:id — admin only. */
exports.remove = async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw httpError(404, 'Project not found');
  res.status(204).end();
};
