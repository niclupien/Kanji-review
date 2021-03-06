(function() {
  var OptionView, QuizCollection, QuizModel, QuizRouter, QuizView, ScoreView,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  QuizModel = Backbone.Model.extend({
    initialize: function() {
      this.set({
        "state": "normal"
      });
      return this.bind("change:state", scoreView.render);
    },
    toggleState: function(state) {
      if (this.get("state") === state) state = void 0;
      return this.set({
        "state": state
      });
    },
    level: function() {
      return parseInt(this.get("niveau"));
    }
  });

  QuizCollection = Backbone.Collection.extend({
    model: QuizModel,
    url: 'js/kanji-collection.json',
    levels: function() {
      return _.uniq(this.invoke('level')).sort(function(a, b) {
        return a - b;
      });
    }
  });

  OptionView = Backbone.View.extend({
    events: {
      "click #shuffle": "shuffleQuestions",
      "click #first": "firstQuestion",
      "click #favorite": "filterModels",
      "click #right": "filterModels",
      "click #wrong": "filterModels",
      "click #normal": "filterModels",
      "change #levels": "filterModels",
      "click #quizFilter": "filterModels"
    },
    template: _.template($("#options-view-tmpl").html()),
    el: "#options",
    render: function() {
      return $(this.el).html(this.template({
        collection: quizRouter.collection
      }));
    },
    shuffleQuestions: function() {
      return quizRouter.shuffleQuestion();
    },
    firstQuestion: function() {
      return quizRouter.firstQuestion();
    },
    filterModels: function() {
      var levels, models, quiz, states;
      levels = _.map($("#levels option:selected"), function(option) {
        return $(option).attr('value');
      });
      states = _.map($("#states input:checked"), function(input) {
        return $(input).attr('id');
      });
      quiz = $("#quizFilter").attr("checked") === "checked";
      console.log(quiz);
      models = _.filter(quizCollection.models, function(model) {
        var _ref, _ref2;
        return (_ref = model.get('niveau').toString(), __indexOf.call(levels, _ref) >= 0) && (_ref2 = model.get('state'), __indexOf.call(states, _ref2) >= 0) && (!quiz || model.get('quiz') === "oui");
      });
      quizRouter.collection = new QuizCollection().reset(models);
      scoreView.render();
      return quizRouter.navigate("questions/first", true);
    }
  });

  QuizView = Backbone.View.extend({
    initialize: function() {
      this.options.model.bind("change:state", this.updateState, this);
      _.bindAll(this, 'keypress');
      return $(document).bind('keypress', this.keypress);
    },
    events: {
      "click #showHint": "showHint",
      "click #showAnswer": "showAnswer",
      "click #previous": "previousQuestion",
      "click #next": "nextQuestion",
      "click #favorite": "toggleFavorite",
      "click #right": "toggleRight",
      "click #wrong": "toggleWrong"
    },
    template: _.template($('#quiz-view-tmpl').html()),
    render: function() {
      $(this.el).html(this.template({
        model: this.model,
        quizIndex: quizRouter.question + 1,
        quizLength: quizRouter.collection.length
      }));
      this.updateState();
      return this.el;
    },
    keypress: function(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      switch (event.which) {
        case 32:
          if ($("#answer").is(":visible")) {
            return this.nextQuestion();
          } else {
            return this.showAnswer();
          }
          break;
        case 104:
          return this.showHint();
      }
      switch (event.keyCode) {
        case 39:
          return this.nextQuestion();
        case 37:
          return this.previousQuestion();
      }
    },
    updateState: function() {
      $(this.el).children("#quiz").children("#deck").children("#prononciation").removeClass();
      if (this.model.get("state") !== void 0) {
        return $(this.el).children("#quiz").children("#deck").children("#prononciation").addClass(this.model.get("state"));
      }
    },
    showHint: function() {
      $("#hint .inner").fadeIn("slow");
      return $("#showHint").attr("disabled", "disabled");
    },
    showAnswer: function(event) {
      $("#answer").slideDown("slow");
      return $("#showAnswer").attr("disabled", "disabled");
    },
    previousQuestion: function() {
      return quizRouter.previousQuestion();
    },
    nextQuestion: function() {
      return quizRouter.nextQuestion();
    },
    toggleFavorite: function() {
      return this.model.toggleState("favorite");
    },
    toggleRight: function() {
      return this.model.toggleState("right");
    },
    toggleWrong: function() {
      return this.model.toggleState("wrong");
    }
  });

  ScoreView = Backbone.View.extend({
    initialize: function() {
      return _.bindAll(this);
    },
    el: "#score",
    favorite: 0,
    right: 0,
    wrong: 0,
    template: _.template($('#score-view-tmpl').html()),
    render: function() {
      if (window.quizRouter !== void 0) {
        this.calculate();
        return $(this.el).html(this.template({
          "favorite": this.favorite,
          "right": this.right,
          "wrong": this.wrong
        }));
      }
    },
    calculate: function() {
      this.favorite = quizRouter.collection.filter(function(model) {
        return model.get("state") === "favorite";
      }).length;
      this.right = quizRouter.collection.filter(function(model) {
        return model.get("state") === "right";
      }).length;
      return this.wrong = quizRouter.collection.filter(function(model) {
        return model.get("state") === "wrong";
      }).length;
    }
  });

  QuizRouter = Backbone.Router.extend({
    initialize: function(options) {
      return this.collection = options.collection;
    },
    quizViewContainer: $('#quiz'),
    quizView: null,
    question: 1,
    routes: {
      "": "startQuiz",
      "questions/shuffle": "shuffleQuestion",
      "questions/next": "nextQuestion",
      "questions/previous": "previousQuestion",
      "questions/first": "firstQuestion",
      "questions/last": "lastQuestion",
      "questions/redraw": "redrawQuestion",
      "questions/:index": "showQuestion"
    },
    startQuiz: function() {
      return this.navigate("questions/1", true);
    },
    firstQuestion: function() {
      return this.navigate("questions/1", true);
    },
    lastQuestion: function() {
      return this.navigate("questions/" + this.collection.length, true);
    },
    redrawQuestion: function() {
      return this.navigate("questions/" + (this.question + 1), true);
    },
    shuffleQuestion: function() {
      this.collection.models = _.shuffle(this.collection.models);
      return this.navigate("questions/first", true);
    },
    previousQuestion: function() {
      var index;
      index = this.question > 1 ? this.question : 1;
      return this.navigate("questions/" + index, true);
    },
    nextQuestion: function() {
      var index;
      index = this.question < this.collection.length - 1 ? this.question + 2 : this.collection.length;
      return this.navigate("questions/" + index, true);
    },
    showQuestion: function(index) {
      var el, model;
      this.question = parseInt(index - 1);
      if (this.quizView !== null) this.quizView.remove();
      model = this.collection.length > 0 ? this.collection.at(this.question) : new QuizModel;
      this.quizView = new QuizView({
        model: model
      });
      el = this.quizView.render();
      return this.quizViewContainer.html(el);
    }
  });

  $(function() {
    return $.getJSON("js/kanji-collection.json", function(data) {
      window.scoreView = new ScoreView();
      window.quizCollection = new QuizCollection;
      quizCollection.reset(_.shuffle(data));
      window.quizRouter = new QuizRouter({
        collection: quizCollection
      });
      new OptionView().render();
      scoreView.render();
      return Backbone.history.start();
    });
  });

}).call(this);
