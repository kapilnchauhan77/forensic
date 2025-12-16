import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Case } from '../types';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Case>) => void;
}

export default function CreateCaseModal({ isOpen, onClose, onSubmit }: CreateCaseModalProps) {
  const [formData, setFormData] = useState({
    case_number: '',
    title: '',
    description: '',
    agency: '',
    source_type: 'other',
    external_reference: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      case_number: '',
      title: '',
      description: '',
      agency: '',
      source_type: 'other',
      external_reference: '',
    });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Create New Case
                      </Dialog.Title>
                      <div className="mt-6 space-y-4">
                        <div>
                          <label htmlFor="case_number" className="block text-sm font-medium text-gray-700">
                            Case Number *
                          </label>
                          <input
                            type="text"
                            id="case_number"
                            required
                            value={formData.case_number}
                            onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-forensic-500 focus:ring-forensic-500 sm:text-sm"
                            placeholder="e.g., CASE-2024-001"
                          />
                        </div>

                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title *
                          </label>
                          <input
                            type="text"
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-forensic-500 focus:ring-forensic-500 sm:text-sm"
                            placeholder="Brief case title"
                          />
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-forensic-500 focus:ring-forensic-500 sm:text-sm"
                            placeholder="Optional case description"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="agency" className="block text-sm font-medium text-gray-700">
                              Agency
                            </label>
                            <input
                              type="text"
                              id="agency"
                              value={formData.agency}
                              onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-forensic-500 focus:ring-forensic-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label htmlFor="source_type" className="block text-sm font-medium text-gray-700">
                              Source Type
                            </label>
                            <select
                              id="source_type"
                              value={formData.source_type}
                              onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-forensic-500 focus:ring-forensic-500 sm:text-sm"
                            >
                              <option value="crime_scene">Crime Scene</option>
                              <option value="booking">Booking</option>
                              <option value="elimination">Elimination</option>
                              <option value="training">Training</option>
                              <option value="quality_control">Quality Control</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="external_reference" className="block text-sm font-medium text-gray-700">
                            External Reference
                          </label>
                          <input
                            type="text"
                            id="external_reference"
                            value={formData.external_reference}
                            onChange={(e) => setFormData({ ...formData, external_reference: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-forensic-500 focus:ring-forensic-500 sm:text-sm"
                            placeholder="Reference from external systems"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 sm:flex sm:flex-row-reverse gap-3">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-forensic-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-forensic-500 sm:w-auto"
                    >
                      Create Case
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
