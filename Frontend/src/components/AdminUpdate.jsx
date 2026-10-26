import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';

// Validation schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedlist', 'graph', 'dp', 'stack', 'tree']),

  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explaination: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case is required'),

  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case is required'),

  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages are required'),

  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Reference solution is required')
    })
  ).length(3, 'All three reference solutions are required')
});

const defaultValues = {
  title: '',
  description: '',
  difficulty: 'easy',
  tags: 'array',

  visibleTestCases: [
    { input: '', output: '', explaination: '' }
  ],

  hiddenTestCases: [
    { input: '', output: '' }
  ],

  startCode: [
    { language: 'C++', initialCode: '' },
    { language: 'Java', initialCode: '' },
    { language: 'JavaScript', initialCode: '' }
  ],

  referenceSolution: [
    { language: 'C++', completeCode: '' },
    { language: 'Java', completeCode: '' },
    { language: 'JavaScript', completeCode: '' }
  ]
};

function AdminUpdate() {
  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues
  });

  // Visible test cases
  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  // Hidden test cases
  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  // Load all problems
  useEffect(() => {
    const fetchProblems = async () => {
      setLoadingProblems(true);
      setErrorMessage('');

      try {
        const response = await axiosClient.get('/problem/getAllProblem');

        setProblems(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        console.error('Fetch problems error:', error);

        setErrorMessage(
          error.response?.data?.message ||
          (typeof error.response?.data === 'string'
            ? error.response.data
            : 'Unable to load problems.')
        );
      } finally {
        setLoadingProblems(false);
      }
    };

    fetchProblems();
  }, []);

  // Load selected problem details
  const handleProblemSelect = async (event) => {
    const id = event.target.value;

    setSelectedProblemId(id);
    setMessage('');
    setErrorMessage('');

    if (!id) {
      reset(defaultValues);
      return;
    }

    setLoadingProblem(true);

    try {
      const response = await axiosClient.get(
        `/problem/problemById/${id}`
      );

      const problem = response.data;

      // Ensure fields exist even if the database has incomplete data.
      const visibleTestCases =
        problem.visibleTestCases?.length > 0
          ? problem.visibleTestCases.map((test) => ({
              input: test.input ?? '',
              output: test.output ?? '',
              explaination:
                test.explaination ?? test.explanation ?? ''
            }))
          : defaultValues.visibleTestCases;

      const hiddenTestCases =
        problem.hiddenTestCases?.length > 0
          ? problem.hiddenTestCases.map((test) => ({
              input: test.input ?? '',
              output: test.output ?? ''
            }))
          : defaultValues.hiddenTestCases;

      const startCode = ['C++', 'Java', 'JavaScript'].map(
        (language) => {
          const existingCode = problem.startCode?.find(
            (item) => item.language === language
          );

          return {
            language,
            initialCode: existingCode?.initialCode ?? ''
          };
        }
      );

      const referenceSolution = [
        'C++',
        'Java',
        'JavaScript'
      ].map((language) => {
        const existingSolution = problem.referenceSolution?.find(
          (item) => item.language === language
        );

        return {
          language,
          completeCode: existingSolution?.completeCode ?? ''
        };
      });

      reset({
        title: problem.title ?? '',
        description: problem.description ?? '',
        difficulty: problem.difficulty ?? 'easy',
        tags: problem.tags ?? 'array',
        visibleTestCases,
        hiddenTestCases,
        startCode,
        referenceSolution
      });
    } catch (error) {
      console.error('Fetch problem details error:', error);

      setErrorMessage(
        error.response?.data?.message ||
        (typeof error.response?.data === 'string'
          ? error.response.data
          : 'Unable to load problem details.')
      );

      reset(defaultValues);
    } finally {
      setLoadingProblem(false);
    }
  };

  // Update existing problem
  const onSubmit = async (data) => {
    if (!selectedProblemId) {
      setErrorMessage('Please select a problem first.');
      return;
    }

    setUpdating(true);
    setMessage('');
    setErrorMessage('');

    try {
      await axiosClient.put(
        `/problem/update/${selectedProblemId}`,
        data
      );

      setMessage('Problem updated successfully!');

      // Refresh the problem list
      const response = await axiosClient.get(
        '/problem/getAllProblem'
      );

      setProblems(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error('Update problem error:', error);

      setErrorMessage(
        error.response?.data?.message ||
        (typeof error.response?.data === 'string'
          ? error.response.data
          : 'Failed to update problem.')
      );
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Update Problem
      </h1>

      {/* Select existing problem */}
      <div className="card bg-base-100 shadow-lg p-6 mb-6">
        <label className="label">
          <span className="label-text font-semibold">
            Select Problem
          </span>
        </label>

        {loadingProblems ? (
          <p>Loading problems...</p>
        ) : (
          <select
            value={selectedProblemId}
            onChange={handleProblemSelect}
            className="select select-bordered w-full"
          >
            <option value="">-- Select a problem --</option>

            {problems.map((problem) => (
              <option key={problem._id} value={problem._id}>
                {problem.title} ({problem.difficulty})
              </option>
            ))}
          </select>
        )}

        {!loadingProblems && problems.length === 0 && (
          <p className="text-warning mt-2">
            No problems found.
          </p>
        )}
      </div>

      {loadingProblem && (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {/* Edit form */}
      {selectedProblemId && !loadingProblem && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Basic information */}
          <div className="card bg-base-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Title</span>
                </label>

                <input
                  {...register('title')}
                  className="input input-bordered w-full"
                />

                {errors.title && (
                  <p className="text-error text-sm mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">
                    Description
                  </span>
                </label>

                <textarea
                  {...register('description')}
                  rows={6}
                  className="textarea textarea-bordered w-full"
                />

                {errors.description && (
                  <p className="text-error text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">
                      Difficulty
                    </span>
                  </label>

                  <select
                    {...register('difficulty')}
                    className="select select-bordered w-full"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Tag</span>
                  </label>

                  <select
                    {...register('tags')}
                    className="select select-bordered w-full"
                  >
                    <option value="array">Array</option>
                    <option value="linkedlist">Linked List</option>
                    <option value="graph">Graph</option>
                    <option value="dp">DP</option>
                    <option value="stack">Stack</option>
                    <option value="tree">Tree</option>
                    
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Test cases */}
          <div className="card bg-base-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Test Cases
            </h2>

            {/* Visible test cases */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">
                  Visible Test Cases
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    appendVisible({
                      input: '',
                      output: '',
                      explaination: ''
                    })
                  }
                  className="btn btn-sm btn-primary"
                >
                  Add Visible Case
                </button>
              </div>

              {visibleFields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-base-300 p-4 rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">
                      Visible Case {index + 1}
                    </h4>

                    <button
                      type="button"
                      onClick={() => removeVisible(index)}
                      disabled={visibleFields.length === 1}
                      className="btn btn-xs btn-error"
                    >
                      Remove
                    </button>
                  </div>

                  <textarea
                    {...register(
                      `visibleTestCases.${index}.input`
                    )}
                    placeholder="Input"
                    rows={3}
                    className="textarea textarea-bordered w-full font-mono"
                  />

                  <input
                    {...register(
                      `visibleTestCases.${index}.output`
                    )}
                    placeholder="Expected output"
                    className="input input-bordered w-full"
                  />

                  <textarea
                    {...register(
                      `visibleTestCases.${index}.explaination`
                    )}
                    placeholder="Explanation"
                    rows={3}
                    className="textarea textarea-bordered w-full"
                  />

                  {errors.visibleTestCases?.[index] && (
                    <p className="text-error text-sm">
                      Please check the input, output and explanation.
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Hidden test cases */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">
                  Hidden Test Cases
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    appendHidden({
                      input: '',
                      output: ''
                    })
                  }
                  className="btn btn-sm btn-primary"
                >
                  Add Hidden Case
                </button>
              </div>

              {hiddenFields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-base-300 p-4 rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">
                      Hidden Case {index + 1}
                    </h4>

                    <button
                      type="button"
                      onClick={() => removeHidden(index)}
                      disabled={hiddenFields.length === 1}
                      className="btn btn-xs btn-error"
                    >
                      Remove
                    </button>
                  </div>

                  <textarea
                    {...register(
                      `hiddenTestCases.${index}.input`
                    )}
                    placeholder="Input"
                    rows={3}
                    className="textarea textarea-bordered w-full font-mono"
                  />

                  <input
                    {...register(
                      `hiddenTestCases.${index}.output`
                    )}
                    placeholder="Expected output"
                    className="input input-bordered w-full"
                  />

                  {errors.hiddenTestCases?.[index] && (
                    <p className="text-error text-sm">
                      Please check the input and output.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Code templates and reference solutions */}
          <div className="card bg-base-100 shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Code Templates & Reference Solutions
            </h2>

            {[0, 1, 2].map((index) => {
              const language = [
                'C++',
                'Java',
                'JavaScript'
              ][index];

              return (
                <div
                  key={language}
                  className="space-y-4 mb-8"
                >
                  <h3 className="text-lg font-semibold">
                    {language}
                  </h3>

                  <div>
                    <label className="label">
                      <span className="label-text">
                        Initial Code
                      </span>
                    </label>

                    <textarea
                      {...register(
                        `startCode.${index}.initialCode`
                      )}
                      rows={8}
                      spellCheck={false}
                      className="textarea textarea-bordered w-full font-mono"
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">
                        Reference Solution
                      </span>
                    </label>

                    <textarea
                      {...register(
                        `referenceSolution.${index}.completeCode`
                      )}
                      rows={12}
                      spellCheck={false}
                      className="textarea textarea-bordered w-full font-mono"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Messages */}
          {message && (
            <div className="alert alert-success">
              <span>{message}</span>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-error">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Update button */}
          <button
            type="submit"
            disabled={updating || loadingProblem}
            className="btn btn-primary w-full"
          >
            {updating
              ? 'Updating Problem...'
              : 'Update Problem'}
          </button>
        </form>
      )}
    </div>
  );
}

export default AdminUpdate;