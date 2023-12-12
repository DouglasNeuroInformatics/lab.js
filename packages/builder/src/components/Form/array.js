import React, { Fragment } from 'react'

import { FieldArray, useFormikContext, getIn } from 'formik'
import { ArrayContextProvider } from '@/context/ArrayContext'

// Basic form array ------------------------------------------------------------

export const FormArray = ({
  name,
  item: Item,
  header: Header,
  footer: Footer,
  wrapper: Wrapper = Fragment,
  wrapperProps,
  bodyWrapper: BodyWrapper = Fragment,
  globalProps = {},
  defaultItem = {},
}) => {
  const { values, setFieldValue, setValues } = useFormikContext()
  const rows = getIn(values, name)

  return (
    <FieldArray name={name}>
      {(arrayHelpers) => (
        <Wrapper {...wrapperProps}>
          <ArrayContextProvider
            name={name}
            values={values}
            arrayHelpers={arrayHelpers}
            setValues={setValues}
            setFieldValue={setFieldValue}
          >
            {Header && <Header {...globalProps} />}
            <BodyWrapper>
              {(rows || []).map((data, index) => (
                <Item
                  key={`${name}[${index}]`}
                  name={`${name}[${index}]`}
                  index={index}
                  isLastItem={index === rows.length - 1}
                  data={data}
                  arrayHelpers={arrayHelpers}
                  {...globalProps}
                />
              ))}
            </BodyWrapper>
            {Footer && (
              <Footer
                addItem={(item) => arrayHelpers.push(item || defaultItem)}
                {...globalProps}
              />
            )}
          </ArrayContextProvider>
        </Wrapper>
      )}
    </FieldArray>
  )
}
