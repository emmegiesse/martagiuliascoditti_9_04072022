/**
* @jest-environment jsdom
*/

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import store from "../__mocks__/store"

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    window.localStorage.setItem("user",JSON.stringify({type: "Employee",})); // localstorage - employé
    Object.defineProperty(window, "location", {
      alue: {hash: ROUTES_PATH["NewBill"],},
    });
  });
  
  describe("When I am on NewBill Page", () => {
    test("Then the newBill should be rendered", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
    })
  })
  
  describe("When I'm on NewBill Page", () => {
    describe("And I upload a image file image (jpg, jpeg or png)", () => {
      test("Then file extension is correct", () => {
        document.body.innerHTML = NewBillUI()
        const newBill = new NewBill({ // instance de la classe NewBill
          document, onNavigate, store: null, localStorage: window.localStorage
        })
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile) // upload file
        const inputFile = screen.queryByTestId("file")
        inputFile.addEventListener("change", handleChangeFile)
        fireEvent.change(inputFile, { // event
          target: {
            files: [new File(["test.jpg"], "test.jpg", { type: "image/jpg" })],
          }
        })
        expect(handleChangeFile).toBeCalled(); // appel de la fonction handleChangeFile
        expect(inputFile.files[0].name).toBe('test.jpg'); // le nom du fichier devrait être test.jpg
        const error = screen.queryByTestId('errorMessage')
        expect(error).toBeFalsy
      })
      
      test('then a bill is created', async () => {
        document.body.innerHTML = NewBillUI()
        const newBill = new NewBill({
          document, onNavigate, store: null, localStorage: window.localStorage
        })    
        const submit = screen.queryByTestId('form-new-bill')
        const billTest = { 
          name: "billTesting",
          date: "2022-01-24",
          type: "restaurant",
          amount: 100,
          pct: 10,
          vat: 10,
          commentary: "",
          fileName: "test",
          fileUrl: "test.jpg"
        }
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)) // simulation de handleSubmit
        newBill.createBill = (newBill) => newBill
        document.querySelector(`input[data-testid="expense-name"]`).value = billTest.name
        document.querySelector(`input[data-testid="datepicker"]`).value = billTest.date
        document.querySelector(`select[data-testid="expense-type"]`).value = billTest.type
        document.querySelector(`input[data-testid="amount"]`).value = billTest.amount
        document.querySelector(`input[data-testid="vat"]`).value = billTest.vat
        document.querySelector(`input[data-testid="pct"]`).value = billTest.pct
        document.querySelector(`textarea[data-testid="commentary"]`).value = billTest.commentary
        newBill.fileUrl = billTest.fileUrl
        newBill.fileName = billTest.fileName 
        submit.addEventListener('click', handleSubmit)
        fireEvent.click(submit)
        expect(handleSubmit).toHaveBeenCalled()
      })
    })
    
    describe("And I upload a image file image other then (jpg, jpeg or png)", () => {
      test("Then file extension is non correct", () => {
        document.body.innerHTML = NewBillUI()
        const newBill = new NewBill({ // instance de la classe NewBill
          document, onNavigate, store: null, localStorage: window.localStorage
        })
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile) // upload file
        const inputFile = screen.queryByTestId("file")
        inputFile.addEventListener("change", handleChangeFile)
        fireEvent.change(inputFile, { // event
          target: {
            files: [new File(["test.pdf"], "test.pdf", { type: "image/pdf" })],
          }
        })
        expect(handleChangeFile).toBeCalled(); // appel de la fonction handleChangeFile
        expect(inputFile.files[0].name).toBe('test.pdf'); // le nom du fichier devrait être test.jpg
        const error = screen.queryByTestId('errorMessage')
        expect(error).toBeFalsy
      })
    })
  })
}) 
  
//--------------------------------------------------------------------//

// test d'intégration POST
