var models = require('../models/models.js');

// Autoload - factoriza el código si ruta incluye :quizId
exports.load = function(req, res, next, quizId) {
	models.Quiz.find({
		where: { id: Number(quizId) },
		include: [{ model: models.Comment }]
	}).then(
		function(quiz) {
			if (quiz) {
				req.quiz = quiz;
				next();
			} else { next(new Error('No existe quizId=' + quizId)); }
		}
	).catch(function(error) {next(error);});
};

// GET /quizes?search=texto_a_buscar
exports.index = function (req, res) {
	if (req.query.search) {
		var busqueda = '%' + req.query.search.trim().replace(/ /g, '%') + '%';
		models.Quiz.findAll({where: ["pregunta like ? ", busqueda], order:"pregunta"}).then(function(quizes) {
			res.render('quizes/index', {quizes: quizes, errors: []});
		}).catch(function(error) {next(error);})
	} else {
		models.Quiz.findAll().then(function(quizes) {
			res.render('quizes/index', {quizes: quizes, errors: []});
		}).catch(function(error) {next(error);})
	}
};

// GET /quizes/:id
exports.show = function (req, res) {
	res.render('quizes/show', {quiz: req.quiz, errors: []});
};

// GET /quizes/:id/answer
exports.answer = function (req, res) {
	var resultado = 'Incorrecto';
	if (req.query.respuesta === req.quiz.respuesta) {
		resultado = 'Correcto';
	}
	res.render('quizes/answer', {
		quiz: req.quiz, 
		respuesta: resultado,
		errors: []
	});
};

// GET /quizes/new
exports.new = function (req, res) {
	var quiz = models.Quiz.build(	//crea objeto quiz
			{pregunta: 'Pregunta', 
			respuesta: 'Respuesta',
			tema: 'otro'}
		);
	res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res) {
	var quiz = models.Quiz.build( req.body.quiz );

	quiz
	.validate()
	.then(
		function(err) {
			if (err) {
				res.render('quizes/new', {quiz: quiz, 
										  errors: err.errors});
			} else {
				quiz // save: guarda en DB los campos pregunta y respuesa de quiz
				.save({fields: ['pregunta', 'respuesta', 'tema']})
				.then( function() {
					res.redirect('/quizes');
				})
			}
		}
	);
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
	var quiz = req.quiz; // autoload de instancia de quiz

	res.render('quizes/edit', {quiz: quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
	req.quiz.pregunta = req.body.quiz.pregunta;
	req.quiz.respuesta = req.body.quiz.respuesta;
	req.quiz.tema = req.body.quiz.tema;

	req.quiz
	.validate()
	.then(
		function (err) {
			if (err) {
				res.render('quizes/edit', {quiz: req.quiz,
										   errors: err.errors});
			} else {
				req.quiz
				.save( {fields: ['pregunta', 'respuesta', 'tema']})
				.then( function(){ res.redirect('/quizes');});
			}	// Redirección HTTP a lista de preguntas (URL relativo)
		}
	);
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
	req.quiz.destroy().then(function() {
		res.redirect('/quizes');
	}).catch(function(error){next(error)});
};
/*
exports.statistics = function(req, res) {
	var stat = {
		numQuizes: 0,
		numComments: 0,
		meanComments: 0,
		quizesComments: 0,
		quizesNoComments: 0
	};
	console.log('--------------------LETS GO');
	models.Quiz.count()
	.then(function (numQuizes) { // número de preguntas
	stat.numQuizes = numQuizes;
	console.log('NUM QUIZES: ' + stat.numQuizes);
	return models.Comment.count();
	})
	.then(function (numComments) { // número de comentarios
	stat.numComments = numComments;
	console.log('NUM COMMENTS: ' + stat.numComments);
	return models.Quiz.count(where);
	})
	.catch(function (err) {
	errors.push(err);
	})
	.finally(function () {
	//res.render('statistics/index', { stat: stat, errors: errors });

	});
};*/

// GET /quizes/statistics
exports.statistics = function(req, res) {
	var stat = {
		numQuizes: 0,
		numComments: 0,
		meanComments: 0,
		quizesComments: 0,
		quizesNoComments: 0
	};
	
	models.Quiz.findAll({include: [{ model: models.Comment }]}).then(function(quizes) {
			stat.numQuizes = quizes.length;
			console.log('NUM QUIZES = ' + stat.numQuizes);
			for (var i=0; i<quizes.length; i++) {
				if (quizes[i].Comments.length == 0){
					stat.quizesNoComments++;
				} else {
					stat.quizesComments++;
					stat.numComments += quizes[i].Comments.length;
				}
			}
			stat.meanComments = stat.numComments / stat.numQuizes;
			console.log('NUM COMMENTS = ' + stat.numComments);
			console.log('MEAN COMMENTS = ' + stat.meanComments);
			console.log('QUIZES COMMENTS = ' + stat.quizesComments);
			console.log('QUIZES NO COMMENTS = ' + stat.quizesNoComments);
			res.render('quizes/statistics', {stat: stat, errors: []});
		}).catch(function(error) {next(error);})
};
